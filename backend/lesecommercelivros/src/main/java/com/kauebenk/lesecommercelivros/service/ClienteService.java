package com.kauebenk.lesecommercelivros.service;

import com.kauebenk.lesecommercelivros.dto.PaginatedResponse;
import com.kauebenk.lesecommercelivros.entity.Bandeira;
import com.kauebenk.lesecommercelivros.entity.CartaoCredito;
import com.kauebenk.lesecommercelivros.entity.Cliente;
import com.kauebenk.lesecommercelivros.entity.CupomTroca;
import com.kauebenk.lesecommercelivros.entity.Endereco;
import com.kauebenk.lesecommercelivros.entity.FormaPagamento;
import com.kauebenk.lesecommercelivros.entity.ItemPedido;
import com.kauebenk.lesecommercelivros.entity.Pedido;
import com.kauebenk.lesecommercelivros.repository.BandeiraRepository;
import com.kauebenk.lesecommercelivros.repository.CartaoCreditoRepository;
import com.kauebenk.lesecommercelivros.repository.ClienteRepository;
import com.kauebenk.lesecommercelivros.repository.CupomTrocaRepository;
import com.kauebenk.lesecommercelivros.repository.EnderecoRepository;
import com.kauebenk.lesecommercelivros.repository.PedidoRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
@Transactional
public class ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private EnderecoRepository enderecoRepository;

    @Autowired
    private CartaoCreditoRepository cartaoRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private BandeiraRepository bandeiraRepository;

    @Autowired
    private CupomTrocaRepository cupomTrocaRepository;

    public Cliente getPerfil() {
        return getAuthenticatedCliente();
    }

    public void updatePerfil(Cliente payload) {
        Cliente current = getAuthenticatedCliente();

        if (payload.getNome() != null) current.setNome(payload.getNome().trim());
        if (payload.getGenero() != null) current.setGenero(payload.getGenero());
        if (payload.getDataNascimento() != null) current.setDataNascimento(payload.getDataNascimento());

        if (payload.getTelefones() != null) {
            payload.getTelefones().forEach(t -> t.setCliente(current));
            current.setTelefones(payload.getTelefones());
        }

        clienteRepository.save(current);
        log.info("[CLIENTE] Perfil atualizado - ClienteID: {} - Email: {}", current.getId(), current.getEmail());
    }

    @Transactional(readOnly = true)
    public List<Endereco> getEnderecos() {
        Cliente current = getAuthenticatedCliente();
        return enderecoRepository.findByClienteId(current.getId());
    }

    public Endereco addEndereco(Endereco endereco) {
        Cliente current = getAuthenticatedCliente();
        endereco.setId(null);
        endereco.setCliente(current);
        Endereco saved = enderecoRepository.save(endereco);
        log.info("[CLIENTE] Endereço adicionado - ClienteID: {} - EnderecoID: {} - CEP: {}", 
                current.getId(), saved.getId(), saved.getCep());
        return saved;
    }

    public Endereco updateEndereco(Long id, Endereco endereco) {
        Cliente current = getAuthenticatedCliente();
        Endereco existing = enderecoRepository.findByIdAndClienteId(id, current.getId())
                .orElseThrow(() -> {
                    log.warn("[CLIENTE] Endereço não encontrado - ClienteID: {} - EnderecoID: {}", current.getId(), id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Endereço não encontrado");
                });

        if (endereco.getApelido() != null) existing.setApelido(endereco.getApelido());
        if (endereco.getTipoResidencia() != null) existing.setTipoResidencia(endereco.getTipoResidencia());
        if (endereco.getTipoLogradouro() != null) existing.setTipoLogradouro(endereco.getTipoLogradouro());
        if (endereco.getLogradouro() != null) existing.setLogradouro(endereco.getLogradouro());
        if (endereco.getNumero() != null) existing.setNumero(endereco.getNumero());
        if (endereco.getBairro() != null) existing.setBairro(endereco.getBairro());
        if (endereco.getCep() != null) existing.setCep(endereco.getCep());
        if (endereco.getCidade() != null) existing.setCidade(endereco.getCidade());
        if (endereco.getEstado() != null) existing.setEstado(endereco.getEstado());
        if (endereco.getPais() != null) existing.setPais(endereco.getPais());
        if (endereco.getObservacoes() != null) existing.setObservacoes(endereco.getObservacoes());
        if (endereco.getTipoEndereco() != null) existing.setTipoEndereco(endereco.getTipoEndereco());

        Endereco updated = enderecoRepository.save(existing);
        log.info("[CLIENTE] Endereço atualizado - ClienteID: {} - EnderecoID: {} - CEP: {}", 
                current.getId(), updated.getId(), updated.getCep());
        return updated;
    }

    public void deleteEndereco(Long id) {
        Cliente current = getAuthenticatedCliente();
        log.info("[CLIENTE] Iniciando remoção de endereço - ClienteID: {} - EnderecoID: {}", current.getId(), id);
        
        Endereco existing = enderecoRepository.findByIdAndClienteId(id, current.getId())
                .orElseThrow(() -> {
                    log.warn("[CLIENTE] Endereço não encontrado para remoção - ClienteID: {} - EnderecoID: {}", current.getId(), id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Endereço não encontrado");
                });
        
        enderecoRepository.delete(existing);
        log.info("[CLIENTE] Endereço removido com sucesso - ClienteID: {} - EnderecoID: {} - CEP: {}", 
                current.getId(), id, existing.getCep());
    }

    @Transactional(readOnly = true)
    public List<CartaoCredito> getCartoes() {
        Cliente current = getAuthenticatedCliente();
        return cartaoRepository.findByClienteId(current.getId());
    }

    public CartaoCredito addCartao(Map<String, Object> payload) {
        Cliente current = getAuthenticatedCliente();
        CartaoCredito card = new CartaoCredito();
        applyCardPayload(card, payload, false);
        card.setCliente(current);

        List<CartaoCredito> currentCards = cartaoRepository.findByClienteId(current.getId());
        boolean requestedPreferred = card.getPreferencial() != null && card.getPreferencial();
        if (currentCards.isEmpty()) {
            card.setPreferencial(true);
        } else if (requestedPreferred) {
            currentCards.forEach(c -> c.setPreferencial(false));
            cartaoRepository.saveAll(currentCards);
        } else {
            card.setPreferencial(false);
        }

        CartaoCredito saved = cartaoRepository.save(card);
        String ultimos4 = saved.getNumero() != null && saved.getNumero().length() >= 4
                ? saved.getNumero().substring(saved.getNumero().length() - 4)
                : "****";
        log.info("[CLIENTE] Cartão adicionado - ClienteID: {} - Final: ****{}", current.getId(), ultimos4);
        return saved;
    }

    public CartaoCredito updateCartao(Long id, Map<String, Object> payload) {
        Cliente current = getAuthenticatedCliente();
        CartaoCredito existing = cartaoRepository.findByIdAndClienteId(id, current.getId())
                .orElseThrow(() -> {
                    log.warn("[CLIENTE] Cartão não encontrado - ClienteID: {} - CartaoID: {}", current.getId(), id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Cartão não encontrado");
                });

        applyCardPayload(existing, payload, true);

        Boolean requestedPreferred = asBoolean(payload.get("preferencial"));
        if (Boolean.TRUE.equals(requestedPreferred)) {
            setCartaoPreferencial(id);
            existing.setPreferencial(true);
        }

        CartaoCredito updated = cartaoRepository.save(existing);
        String ultimos4 = updated.getNumero() != null && updated.getNumero().length() >= 4
                ? updated.getNumero().substring(updated.getNumero().length() - 4)
                : "****";
        log.info("[CLIENTE] Cartão atualizado - ClienteID: {} - CartaoID: {} - Final: ****{}", 
                current.getId(), updated.getId(), ultimos4);
        return updated;
    }

    public void setCartaoPreferencial(Long id) {
        Cliente current = getAuthenticatedCliente();
        CartaoCredito preferred = cartaoRepository.findByIdAndClienteId(id, current.getId())
                .orElseThrow(() -> {
                    log.warn("[CLIENTE] Cartão não encontrado para definir como preferencial - ClienteID: {} - CartaoID: {}", 
                            current.getId(), id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Cartão não encontrado");
                });

        List<CartaoCredito> cards = cartaoRepository.findByClienteId(current.getId());
        cards.forEach(c -> c.setPreferencial(Objects.equals(c.getId(), preferred.getId())));
        cartaoRepository.saveAll(cards);
        log.info("[CLIENTE] Cartão definido como preferencial - ClienteID: {} - CartaoID: {}", current.getId(), id);
    }

    public void deleteCartao(Long id) {
        Cliente current = getAuthenticatedCliente();
        log.info("[CLIENTE] Iniciando remoção de cartão - ClienteID: {} - CartaoID: {}", current.getId(), id);
        
        CartaoCredito existing = cartaoRepository.findByIdAndClienteId(id, current.getId())
                .orElseThrow(() -> {
                    log.warn("[CLIENTE] Cartão não encontrado para remoção - ClienteID: {} - CartaoID: {}", current.getId(), id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Cartão não encontrado");
                });
        
        String ultimosDigitos = existing.getNumero().substring(Math.max(0, existing.getNumero().length() - 4));
        cartaoRepository.delete(existing);
        log.info("[CLIENTE] Cartão removido com sucesso - ClienteID: {} - CartaoID: {} - Final: ****{}", 
                current.getId(), id, ultimosDigitos);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<Map<String, Object>> getTransacoes(Pageable pageable) {
        Cliente current = getAuthenticatedCliente();
        Page<Pedido> page = pedidoRepository.findByClienteId(current.getId(), pageable);
        Page<Map<String, Object>> mapped = page.map(this::toOrderResponse);
        return new PaginatedResponse<>(mapped);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCuponsTroca() {
        Cliente current = getAuthenticatedCliente();
        return cupomTrocaRepository.findByClienteIdAndUtilizadoFalseOrderByDataGeracaoDesc(current.getId())
                .stream()
                .map(this::toCupomTrocaResponse)
                .toList();
    }

    private Cliente getAuthenticatedCliente() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            log.warn("[CLIENTE] Tentativa de acesso sem autenticação");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado");
        }
        return clienteRepository.findFirstByEmailIgnoreCaseOrderByIdAsc(authentication.getName())
                .orElseThrow(() -> {
                    log.warn("[CLIENTE] Cliente não encontrado no banco - Email: {}", authentication.getName());
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cliente não encontrado");
                });
    }

    private void applyCardPayload(CartaoCredito target, Map<String, Object> payload, boolean partial) {
        String numero = asString(payload.get("numero"));
        String nomeImpresso = asString(payload.get("nomeImpresso"));
        String codigoSeguranca = asString(payload.get("codigoSeguranca"));
        Object bandeiraRaw = payload.get("bandeira");
        Boolean preferencial = asBoolean(payload.get("preferencial"));

        if (!partial || numero != null) {
            if (numero == null || numero.trim().isEmpty()) {
                log.warn("[CLIENTE] Validação falhada - Número do cartão vazio ou nulo");
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Número do cartão é obrigatório");
            }
            target.setNumero(numero.replaceAll("\\s+", ""));
        }

        if (!partial || nomeImpresso != null) {
            if (nomeImpresso == null || nomeImpresso.trim().isEmpty()) {
                log.warn("[CLIENTE] Validação falhada - Nome impresso vazio ou nulo");
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome impresso é obrigatório");
            }
            target.setNomeImpresso(nomeImpresso.trim());
        }

        if (!partial || codigoSeguranca != null) {
            if (codigoSeguranca == null || codigoSeguranca.trim().isEmpty()) {
                log.warn("[CLIENTE] Validação falhada - Código de segurança vazio ou nulo");
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código de segurança é obrigatório");
            }
            target.setCodigoSeguranca(codigoSeguranca.trim());
        }

        if (!partial || bandeiraRaw != null) {
            target.setBandeira(resolveBandeira(bandeiraRaw));
        }

        if (preferencial != null) {
            target.setPreferencial(preferencial);
        }
    }

    private Bandeira resolveBandeira(Object raw) {
        if (raw == null) {
            log.warn("[CLIENTE] Validação falhada - Bandeira é nula");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bandeira é obrigatória");
        }

        if (raw instanceof Number number) {
            return bandeiraRepository.findById(number.longValue())
                    .orElseThrow(() -> {
                        log.warn("[CLIENTE] Validação falhada - Bandeira inválida (ID: {})", number.longValue());
                        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bandeira inválida");
                    });
        }

        if (raw instanceof Map<?, ?> map) {
            Object nestedId = map.get("id");
            if (nestedId != null) {
                Long id = asLong(nestedId);
                if (id == null) {
                    log.warn("[CLIENTE] Validação falhada - Bandeira inválida (ID não numérico)");
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bandeira inválida");
                }
                return bandeiraRepository.findById(id)
                        .orElseThrow(() -> {
                            log.warn("[CLIENTE] Validação falhada - Bandeira inválida (ID: {})", id);
                            return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bandeira inválida");
                        });
            }
            Object nestedName = map.get("nome");
            if (nestedName != null) {
                return findBandeiraByName(String.valueOf(nestedName));
            }
            log.warn("[CLIENTE] Validação falhada - Bandeira inválida (Map sem id ou nome)");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bandeira inválida");
        }

        String value = String.valueOf(raw).trim();
        if (value.isEmpty()) {
            log.warn("[CLIENTE] Validação falhada - Bandeira inválida (String vazia)");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bandeira inválida");
        }

        if (value.chars().allMatch(Character::isDigit)) {
            Long id = Long.valueOf(value);
            return bandeiraRepository.findById(id)
                    .orElseThrow(() -> {
                        log.warn("[CLIENTE] Validação falhada - Bandeira inválida (ID: {})", id);
                        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bandeira inválida");
                    });
        }

        return findBandeiraByName(value);
    }

    private Bandeira findBandeiraByName(String rawName) {
        String normalized = rawName.trim();
        String upper = normalized.toUpperCase();
        if ("VISA".equals(upper)) normalized = "Visa";
        if ("MASTERCARD".equals(upper)) normalized = "MasterCard";
        if ("AMEX".equals(upper) || "AMERICAN EXPRESS".equals(upper)) normalized = "American Express";

        String finalName = normalized;
        return bandeiraRepository.findFirstByNomeIgnoreCase(finalName)
                .orElseThrow(() -> {
                    log.warn("[CLIENTE] Validação falhada - Bandeira inválida (Nome: {})", finalName);
                    return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bandeira inválida");
                });
    }

    private Map<String, Object> toOrderResponse(Pedido pedido) {
        Map<String, Object> out = new HashMap<>();
        out.put("id", pedido.getId());
        out.put("pedidoId", pedido.getId());
        out.put("numero", "PED-" + pedido.getId());
        out.put("numeroNota", "PED-" + pedido.getId());
        out.put("status", pedido.getStatus() != null ? pedido.getStatus().name() : null);
        out.put("valorFrete", pedido.getValorFrete());
        out.put("valorTotal", pedido.getValorTotal());
        out.put("valor", pedido.getValorTotal());
        out.put("dataPedido", pedido.getDataPedido());
        out.put("data", pedido.getDataPedido());
        out.put("pagamentoConfirmado", pedido.getPagamentoConfirmado());
        out.put("enderecoEntrega", parseEndereco(pedido.getEnderecoEntrega()));

        List<Map<String, Object>> itens = pedido.getItens() == null ? List.of() : pedido.getItens().stream()
                .map(this::toOrderItemResponse)
                .toList();
        out.put("itens", itens);

        out.put("pagamento", toPaymentResponse(pedido.getFormasPagamento()));
        return out;
    }

    private Map<String, Object> toOrderItemResponse(ItemPedido item) {
        Map<String, Object> out = new HashMap<>();
        out.put("id", item.getId());
        out.put("livroId", item.getLivro() != null ? item.getLivro().getId() : null);
        out.put("titulo", item.getLivro() != null ? item.getLivro().getTitulo() : null);
        out.put("livroTitulo", item.getLivro() != null ? item.getLivro().getTitulo() : null);
        out.put("quantidade", item.getQuantidade());
        out.put("valorUnitario", item.getValorUnitario());
        if (item.getValorUnitario() != null && item.getQuantidade() != null) {
            out.put("subtotal", item.getValorUnitario().multiply(java.math.BigDecimal.valueOf(item.getQuantidade())));
        }
        return out;
    }

    private Map<String, Object> toCupomTrocaResponse(CupomTroca cupom) {
        Map<String, Object> out = new HashMap<>();
        out.put("id", cupom.getId());
        out.put("valor", cupom.getValor());
        out.put("utilizado", cupom.getUtilizado());
        out.put("dataGeracao", cupom.getDataGeracao());
        out.put("pedidoOrigem", cupom.getPedidoOrigem() != null ? cupom.getPedidoOrigem().getId() : null);
        return out;
    }

    private Map<String, Object> toPaymentResponse(List<FormaPagamento> formas) {
        if (formas == null || formas.isEmpty()) return null;
        FormaPagamento fp = formas.get(0);
        Map<String, Object> out = new HashMap<>();
        out.put("tipo", fp.getTipo() != null ? fp.getTipo().name() : null);
        if (fp.getCartaoCredito() != null) {
            String numero = fp.getCartaoCredito().getNumero();
            String ultimosDigitos = numero != null && numero.length() >= 4
                    ? numero.substring(numero.length() - 4)
                    : numero;
            out.put("ultimosDigitos", ultimosDigitos);
            if (fp.getCartaoCredito().getBandeira() != null) {
                out.put("bandeira", fp.getCartaoCredito().getBandeira().getNome());
            }
        }
        return out;
    }

    private Map<String, Object> parseEndereco(String enderecoRaw) {
        if (enderecoRaw == null || enderecoRaw.isBlank()) return null;
        String[] parts = enderecoRaw.split(",");
        Map<String, Object> out = new HashMap<>();
        out.put("logradouro", parts.length > 0 ? parts[0].trim() : enderecoRaw);
        out.put("numero", parts.length > 1 ? parts[1].trim() : "");
        out.put("bairro", parts.length > 2 ? parts[2].trim() : "");
        out.put("cidade", parts.length > 3 ? parts[3].trim() : "");
        out.put("estado", parts.length > 4 ? parts[4].trim() : "");
        out.put("cep", "");
        return out;
    }

    private String asString(Object value) {
        if (value == null) return null;
        return String.valueOf(value);
    }

    private Long asLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.longValue();
        String raw = String.valueOf(value).trim();
        if (raw.isEmpty()) return null;
        try {
            return Long.parseLong(raw);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Boolean asBoolean(Object value) {
        if (value == null) return null;
        if (value instanceof Boolean b) return b;
        return Boolean.parseBoolean(String.valueOf(value));
    }
}
