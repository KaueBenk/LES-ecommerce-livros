package com.kauebenk.lesecommercelivros.service;

import com.kauebenk.lesecommercelivros.entity.CarrinhoCompra;
import com.kauebenk.lesecommercelivros.entity.Cliente;
import com.kauebenk.lesecommercelivros.entity.Estoque;
import com.kauebenk.lesecommercelivros.entity.ItemCarrinho;
import com.kauebenk.lesecommercelivros.entity.Livro;
import com.kauebenk.lesecommercelivros.repository.CarrinhoCompraRepository;
import com.kauebenk.lesecommercelivros.repository.ClienteRepository;
import com.kauebenk.lesecommercelivros.repository.EstoqueRepository;
import com.kauebenk.lesecommercelivros.repository.ItemCarrinhoRepository;
import com.kauebenk.lesecommercelivros.repository.LivroRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@Transactional
public class CarrinhoService {

    private static final String PARAM_CART_TTL_MINUTOS = "CARRINHO_TTL_MINUTOS";
    private static final BigDecimal FRETE_FIXO = BigDecimal.TEN;

    @Autowired
    private CarrinhoCompraRepository carrinhoRepository;

    @Autowired
    private ItemCarrinhoRepository itemRepository;

    @Autowired
    private LivroRepository livroRepository;

    @Autowired
    private EstoqueRepository estoqueRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private ParametroSistemaService parametroSistemaService;

    public Map<String, Object> getCarrinho() {
        CarrinhoCompra carrinho = getOrCreateCarrinho();
        Cliente cliente = carrinho.getCliente();
        String clienteEmail = cliente != null ? cliente.getEmail() : "unknown";
        log.info("[CARRINHO] Buscando carrinho - Cliente: {}", clienteEmail);
        
        List<Map<String, Object>> itensRemovidos = processarExpiracaoCarrinho(carrinho);
        CarrinhoCompra atualizado = carrinhoRepository.findById(carrinho.getId()).orElse(carrinho);
        return toCartResponse(atualizado, itensRemovidos);
    }

    public Map<String, Object> addItem(Map<String, Integer> request) {
        Integer livroIdRaw = request.get("livroId");
        Integer quantidadeRaw = request.get("quantidade");
        if (livroIdRaw == null || quantidadeRaw == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "livroId e quantidade são obrigatórios");
        }
        int quantidade = quantidadeRaw;
        if (quantidade <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantidade deve ser maior que zero");
        }

        CarrinhoCompra carrinho = getOrCreateCarrinho();
        Cliente cliente = carrinho.getCliente();
        String clienteEmail = cliente != null ? cliente.getEmail() : "unknown";
        processarExpiracaoCarrinho(carrinho);

        Long livroId = livroIdRaw.longValue();
        Livro livro = livroRepository.findById(livroId)
                .orElseThrow(() -> {
                    log.warn("[CARRINHO] Livro não encontrado - Cliente: {} - LivroID: {}", clienteEmail, livroId);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Livro não encontrado");
                });

        ItemCarrinho item = itemRepository.findByCarrinhoIdAndLivroId(carrinho.getId(), livroId).orElse(null);
        int quantidadeAnterior = item == null ? 0 : safeInt(item.getQuantidade());
        int novaQuantidade = quantidadeAnterior + quantidade;
        int delta = novaQuantidade - quantidadeAnterior;
        if (delta > 0) {
            bloquearEstoque(livro, delta, clienteEmail);
        }

        if (item == null) {
            item = new ItemCarrinho();
            item.setCarrinho(carrinho);
            item.setLivro(livro);
        }
        item.setQuantidade(novaQuantidade);
        item.setBloqueadoEm(LocalDateTime.now());
        
        log.info("[CARRINHO] Salvando item no carrinho - Cliente: {} - LivroID: {} - QuantidadeFinal: {}", 
                clienteEmail, livroId, novaQuantidade);
        ItemCarrinho saved = itemRepository.save(item);
        log.info("[CARRINHO] Item salvo no carrinho - ItemID: {} - LivroID: {} - Quantidade: {}", 
                saved.getId(), livroId, saved.getQuantidade());

        carrinho.setUltimaAtualizacao(LocalDateTime.now());
        carrinhoRepository.save(carrinho);

        log.info("[CARRINHO] Item adicionado - Cliente: {} - LivroID: {} - Quantidade: {} - QuantidadeTotal: {}", 
                clienteEmail, livroId, quantidade, novaQuantidade);

        Map<String, Object> res = new HashMap<>();
        res.put("id", saved.getId());
        res.put("livroId", livroId);
        res.put("quantidade", saved.getQuantidade());
        res.put("bloqueadoEm", saved.getBloqueadoEm());
        return res;
    }

    public void updateItem(Long id, Integer quantidade) {
        if (quantidade == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantidade é obrigatória");
        }
        CarrinhoCompra carrinho = getOrCreateCarrinho();
        Cliente cliente = carrinho.getCliente();
        String clienteEmail = cliente != null ? cliente.getEmail() : "unknown";
        processarExpiracaoCarrinho(carrinho);

        ItemCarrinho item = itemRepository.findByIdAndCarrinhoId(id, carrinho.getId())
                .orElseThrow(() -> {
                    log.warn("[CARRINHO] Item não encontrado no carrinho - Cliente: {} - ItemID: {}", clienteEmail, id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Item não encontrado no carrinho");
                });

        Long livroId = item.getLivro() != null ? item.getLivro().getId() : null;
        int quantidadeAnterior = safeInt(item.getQuantidade());
        if (quantidade <= 0) {
            desbloquearEstoque(item.getLivro(), quantidadeAnterior);
            
            log.info("[CARRINHO] Removendo item via update (quantidade <= 0) - Cliente: {} - ItemID: {} - LivroID: {}", 
                    clienteEmail, id, livroId);
            itemRepository.delete(item);
            log.info("[CARRINHO] Item removido via update - ItemID: {} - LivroID: {}", id, livroId);
            
            carrinho.setUltimaAtualizacao(LocalDateTime.now());
            carrinhoRepository.save(carrinho);
            log.info("[CARRINHO] Item removido via update (quantidade <= 0) - Cliente: {} - ItemID: {} - LivroID: {}", 
                    clienteEmail, id, livroId);
            return;
        }

        int delta = quantidade - quantidadeAnterior;
        if (delta > 0) {
            bloquearEstoque(item.getLivro(), delta, clienteEmail);
        } else if (delta < 0) {
            desbloquearEstoque(item.getLivro(), Math.abs(delta));
        }

        item.setQuantidade(quantidade);
        item.setBloqueadoEm(LocalDateTime.now());
        
        log.info("[CARRINHO] Atualizando quantidade do item - Cliente: {} - ItemID: {} - QuantidadeAnterior: {} - NovaQuantidade: {}", 
                clienteEmail, id, quantidadeAnterior, quantidade);
        itemRepository.save(item);
        log.info("[CARRINHO] Quantidade do item atualizada - ItemID: {} - NovaQuantidade: {}", id, quantidade);

        carrinho.setUltimaAtualizacao(LocalDateTime.now());
        carrinhoRepository.save(carrinho);
        
        log.info("[CARRINHO] Quantidade atualizada - Cliente: {} - ItemID: {} - LivroID: {} - QuantidadeAnterior: {} - NovaQuantidade: {}", 
                clienteEmail, id, livroId, quantidadeAnterior, quantidade);
    }

    public void deleteItem(Long id) {
        CarrinhoCompra carrinho = getOrCreateCarrinho();
        Cliente cliente = carrinho.getCliente();
        String clienteEmail = cliente != null ? cliente.getEmail() : "unknown";
        processarExpiracaoCarrinho(carrinho);

        ItemCarrinho item = itemRepository.findByIdAndCarrinhoId(id, carrinho.getId())
                .orElseThrow(() -> {
                    log.warn("[CARRINHO] Item não encontrado no carrinho - Cliente: {} - ItemID: {}", clienteEmail, id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Item não encontrado no carrinho");
                });

        Long livroId = item.getLivro() != null ? item.getLivro().getId() : null;
        desbloquearEstoque(item.getLivro(), safeInt(item.getQuantidade()));
        
        log.info("[CARRINHO] Excluindo item do carrinho - Cliente: {} - ItemID: {} - LivroID: {}", 
                clienteEmail, id, livroId);
        itemRepository.delete(item);
        log.info("[CARRINHO] Item excluído do carrinho - ItemID: {} - LivroID: {}", id, livroId);
        
        carrinho.setUltimaAtualizacao(LocalDateTime.now());
        carrinhoRepository.save(carrinho);
        
        log.info("[CARRINHO] Item removido - Cliente: {} - ItemID: {} - LivroID: {}", clienteEmail, id, livroId);
    }

    public void clearCart() {
        CarrinhoCompra carrinho = getOrCreateCarrinho();
        Cliente cliente = carrinho.getCliente();
        String clienteEmail = cliente != null ? cliente.getEmail() : "unknown";
        List<ItemCarrinho> itens = itemRepository.findByCarrinhoId(carrinho.getId());
        
        int totalItens = itens.size();
        for (ItemCarrinho item : itens) {
            desbloquearEstoque(item.getLivro(), safeInt(item.getQuantidade()));
        }
        
        log.info("[CARRINHO] Excluindo todos os itens do carrinho - Cliente: {} - TotalItens: {}", 
                clienteEmail, totalItens);
        itemRepository.deleteAllByCarrinhoIdQuery(carrinho.getId());
        log.info("[CARRINHO] Todos os itens excluídos do carrinho - TotalItens: {}", totalItens);
        
        carrinho.setUltimaAtualizacao(LocalDateTime.now());
        carrinhoRepository.save(carrinho);
        
        log.info("[CARRINHO] Carrinho limpo - Cliente: {} - TotalItensRemovidos: {}", clienteEmail, totalItens);
    }

    private List<Map<String, Object>> processarExpiracaoCarrinho(CarrinhoCompra carrinho) {
        List<ItemCarrinho> itens = itemRepository.findByCarrinhoId(carrinho.getId());
        if (itens.isEmpty()) return List.of();

        long ttlMinutos = getCartTtlMinutos();
        LocalDateTime ultimoBloqueio = itens.stream()
                .map(ItemCarrinho::getBloqueadoEm)
                .filter(data -> data != null)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        if (ultimoBloqueio == null) return List.of();

        LocalDateTime expiracao = ultimoBloqueio.plusMinutes(ttlMinutos);
        if (LocalDateTime.now().isBefore(expiracao)) {
            return List.of();
        }

        Cliente cliente = carrinho.getCliente();
        String clienteEmail = cliente != null ? cliente.getEmail() : "unknown";
        
        List<Map<String, Object>> removidos = new ArrayList<>();
        for (ItemCarrinho item : itens) {
            Map<String, Object> removido = new HashMap<>();
            removido.put("itemId", item.getId());
            removido.put("livroId", item.getLivro() != null ? item.getLivro().getId() : null);
            removido.put("titulo", item.getLivro() != null ? item.getLivro().getTitulo() : null);
            removido.put("quantidade", item.getQuantidade());
            removido.put("motivo", "RESERVA_EXPIRADA");
            removidos.add(removido);

            desbloquearEstoque(item.getLivro(), safeInt(item.getQuantidade()));
            
            log.info("[CARRINHO] Excluindo item expirado - Cliente: {} - ItemID: {} - LivroID: {}", 
                    clienteEmail, item.getId(), item.getLivro() != null ? item.getLivro().getId() : null);
            itemRepository.delete(item);
            log.info("[CARRINHO] Item expirado excluído - ItemID: {}", item.getId());
        }

        carrinho.setUltimaAtualizacao(LocalDateTime.now());
        carrinhoRepository.save(carrinho);
        
        log.info("[CARRINHO] Itens expirados removidos - Cliente: {} - TotalItensExpirados: {} - TTL: {} minutos", 
                clienteEmail, removidos.size(), ttlMinutos);
        
        return removidos;
    }

    private void bloquearEstoque(Livro livro, int quantidade, String clienteEmail) {
        if (livro == null || livro.getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Livro inválido");
        }
        Estoque estoque = estoqueRepository.findByLivroId(livro.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Livro sem estoque: " + livro.getTitulo()
                ));

        int total = safeInt(estoque.getQuantidadeTotal());
        int bloqueado = safeInt(estoque.getQuantidadeBloqueada());
        int livre = Math.max(0, total - bloqueado);
        if (quantidade > livre) {
            log.warn("[CARRINHO] Estoque insuficiente - Cliente: {} - LivroID: {} - Solicitado: {} - Disponível: {}", 
                    clienteEmail, livro.getId(), quantidade, livre);
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Quantidade indisponível em estoque. Disponível: " + livre
            );
        }

        int novoBloqueado = bloqueado + quantidade;
        estoque.setQuantidadeBloqueada(novoBloqueado);
        estoque.setQuantidadeDisponivel(Math.max(0, total - novoBloqueado));
        
        log.info("[ESTOQUE] Bloqueando estoque - LivroID: {} - Cliente: {} - Quantidade: {} - NovoBloqueado: {}", 
                livro.getId(), clienteEmail, quantidade, novoBloqueado);
        estoqueRepository.save(estoque);
        log.info("[ESTOQUE] Estoque bloqueado - LivroID: {} - QuantidadeBloqueada: {} - QuantidadeDisponivel: {}", 
                livro.getId(), estoque.getQuantidadeBloqueada(), estoque.getQuantidadeDisponivel());
    }
    
    private void bloquearEstoque(Livro livro, int quantidade) {
        bloquearEstoque(livro, quantidade, "unknown");
    }

    private void desbloquearEstoque(Livro livro, int quantidade) {
        if (livro == null || livro.getId() == null || quantidade <= 0) return;
        Estoque estoque = estoqueRepository.findByLivroId(livro.getId()).orElse(null);
        if (estoque == null) return;

        int total = safeInt(estoque.getQuantidadeTotal());
        int bloqueado = safeInt(estoque.getQuantidadeBloqueada());
        int novoBloqueado = Math.max(0, bloqueado - quantidade);

        estoque.setQuantidadeBloqueada(novoBloqueado);
        estoque.setQuantidadeDisponivel(Math.max(0, total - novoBloqueado));
        
        log.info("[ESTOQUE] Desbloqueando estoque - LivroID: {} - Quantidade: {} - NovoBloqueado: {}", 
                livro.getId(), quantidade, novoBloqueado);
        estoqueRepository.save(estoque);
        log.info("[ESTOQUE] Estoque desbloqueado - LivroID: {} - QuantidadeBloqueada: {} - QuantidadeDisponivel: {}", 
                livro.getId(), estoque.getQuantidadeBloqueada(), estoque.getQuantidadeDisponivel());
    }

    private long getCartTtlMinutos() {
        long ttl = parametroSistemaService.getLong(PARAM_CART_TTL_MINUTOS, 30L);
        return ttl <= 0 ? 30L : ttl;
    }

    private CarrinhoCompra getOrCreateCarrinho() {
        Cliente current = getAuthenticatedCliente();
        return carrinhoRepository.findByClienteId(current.getId()).orElseGet(() -> {
            CarrinhoCompra novo = new CarrinhoCompra();
            novo.setCliente(current);
            novo.setUltimaAtualizacao(LocalDateTime.now());
            
            log.info("[CARRINHO] Criando novo carrinho - Cliente: {}", current.getEmail());
            CarrinhoCompra saved = carrinhoRepository.save(novo);
            log.info("[CARRINHO] Novo carrinho criado - CarrinhoID: {} - Cliente: {}", saved.getId(), current.getEmail());
            return saved;
        });
    }

    private Cliente getAuthenticatedCliente() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado");
        }
        return clienteRepository.findFirstByEmailIgnoreCaseOrderByIdAsc(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cliente não encontrado"));
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private Map<String, Object> toCartResponse(CarrinhoCompra carrinho, List<Map<String, Object>> itensRemovidos) {
        List<ItemCarrinho> itens = itemRepository.findByCarrinhoId(carrinho.getId());
        long ttl = getCartTtlMinutos();

        BigDecimal subtotal = BigDecimal.ZERO;
        int totalItens = 0;
        LocalDateTime maiorExpiracao = null;
        List<Map<String, Object>> itensPayload = new ArrayList<>();

        for (ItemCarrinho item : itens) {
            BigDecimal valorUnitario = item.getLivro() != null && item.getLivro().getValorVenda() != null
                    ? item.getLivro().getValorVenda()
                    : BigDecimal.ZERO;
            int quantidade = safeInt(item.getQuantidade());
            BigDecimal itemSubtotal = valorUnitario.multiply(BigDecimal.valueOf(quantidade));

            Map<String, Object> out = new HashMap<>();
            out.put("id", item.getId());
            out.put("livroId", item.getLivro() != null ? item.getLivro().getId() : null);
            out.put("titulo", item.getLivro() != null ? item.getLivro().getTitulo() : null);
            out.put("quantidade", quantidade);
            out.put("valorUnitario", valorUnitario);
            out.put("subtotal", itemSubtotal);
            out.put("bloqueadoEm", item.getBloqueadoEm());
            itensPayload.add(out);

            subtotal = subtotal.add(itemSubtotal);
            totalItens += quantidade;

            if (item.getBloqueadoEm() != null) {
                LocalDateTime expiracao = item.getBloqueadoEm().plusMinutes(ttl);
                if (maiorExpiracao == null || expiracao.isAfter(maiorExpiracao)) {
                    maiorExpiracao = expiracao;
                }
            }
        }

        BigDecimal frete = itensPayload.isEmpty() ? BigDecimal.ZERO : FRETE_FIXO;
        BigDecimal total = subtotal.add(frete);

        Map<String, Object> response = new HashMap<>();
        response.put("itens", itensPayload);
        response.put("itensRemovidos", itensRemovidos == null ? List.of() : itensRemovidos);
        response.put("compraHabilitada", itensRemovidos == null || itensRemovidos.isEmpty());
        response.put("tempoReservaMinutos", ttl);
        response.put("totalItens", totalItens);
        response.put("valorSubtotal", subtotal);
        response.put("valorFrete", frete);
        response.put("valorTotal", total);
        response.put("expiresAt", maiorExpiracao);
        return response;
    }
}
