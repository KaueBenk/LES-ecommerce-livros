package com.kauebenk.lesecommercelivros.service;

import com.kauebenk.lesecommercelivros.dto.PaginatedResponse;
import com.kauebenk.lesecommercelivros.entity.Avaliacao;
import com.kauebenk.lesecommercelivros.entity.CartaoCredito;
import com.kauebenk.lesecommercelivros.entity.Cliente;
import com.kauebenk.lesecommercelivros.entity.CupomTroca;
import com.kauebenk.lesecommercelivros.entity.Endereco;
import com.kauebenk.lesecommercelivros.entity.Estoque;
import com.kauebenk.lesecommercelivros.entity.ItemPedido;
import com.kauebenk.lesecommercelivros.entity.ItemTroca;
import com.kauebenk.lesecommercelivros.entity.Pedido;
import com.kauebenk.lesecommercelivros.entity.SolicitacaoTroca;
import com.kauebenk.lesecommercelivros.entity.enums.OperacaoLog;
import com.kauebenk.lesecommercelivros.entity.enums.StatusPedido;
import com.kauebenk.lesecommercelivros.entity.enums.StatusTroca;
import com.kauebenk.lesecommercelivros.repository.AvaliacaoRepository;
import com.kauebenk.lesecommercelivros.repository.CarrinhoCompraRepository;
import com.kauebenk.lesecommercelivros.repository.ClienteRepository;
import com.kauebenk.lesecommercelivros.repository.CupomTrocaRepository;
import com.kauebenk.lesecommercelivros.repository.EstoqueRepository;
import com.kauebenk.lesecommercelivros.repository.ItemCarrinhoRepository;
import com.kauebenk.lesecommercelivros.repository.NotificacaoRepository;
import com.kauebenk.lesecommercelivros.repository.PedidoRepository;
import com.kauebenk.lesecommercelivros.repository.SolicitacaoTrocaRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class AdminWorkflowService {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private AvaliacaoRepository avaliacaoRepository;

    @Autowired
    private SolicitacaoTrocaRepository solicitacaoTrocaRepository;

    @Autowired
    private EstoqueRepository estoqueRepository;

    @Autowired
    private CupomTrocaRepository cupomTrocaRepository;

    @Autowired
    private CarrinhoCompraRepository carrinhoCompraRepository;

    @Autowired
    private ItemCarrinhoRepository itemCarrinhoRepository;

    @Autowired
    private NotificacaoRepository notificacaoRepository;

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private TransacaoLogService transacaoLogService;

    @Transactional(readOnly = true)
    public PaginatedResponse<Map<String, Object>> getPedidos(String status, Pageable pageable) {
        StatusPedido statusPedido = parseStatusPedido(status);
        Page<Pedido> page = statusPedido == null
                ? pedidoRepository.findAll(pageable)
                : pedidoRepository.findByStatus(statusPedido, pageable);
        Page<Map<String, Object>> mapped = page.map(this::toPedidoResponse);
        return new PaginatedResponse<>(mapped);
    }

    public Map<String, Object> despacharPedido(Long pedidoId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> {
                    log.warn("[ADMIN-WORKFLOW] Pedido não encontrado - PedidoID: {}", pedidoId);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido não encontrado");
                });
        StatusPedido statusAnterior = pedido.getStatus();
        if (pedido.getStatus() != StatusPedido.APROVADA) {
            log.warn("[ADMIN-WORKFLOW] Validação falhou ao despachar - PedidoID: {} - Status atual: {} - Esperado: APROVADA", 
                    pedidoId, pedido.getStatus());
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Apenas pedidos APROVADA podem ser despachados"
            );
        }
        pedido.setStatus(StatusPedido.EM_TRANSITO);
        pedidoRepository.save(pedido);

        String clienteEmail = pedido.getCliente() != null ? pedido.getCliente().getEmail() : "desconhecido";
        log.info("[ADMIN-WORKFLOW] Pedido despachado - PedidoID: {} - Cliente: {}", pedidoId, clienteEmail);

        if (pedido.getCliente() != null) {
            notificacaoService.criar(
                    pedido.getCliente(),
                    "Pedido despachado",
                    "Seu pedido PED-" + pedido.getId() + " foi despachado e está em trânsito.",
                    "/account/orders",
                    "PEDIDO_DESPACHADO"
            );
        }

        transacaoLogService.registrar(
                "PEDIDO",
                pedido.getId(),
                OperacaoLog.UPDATE,
                statusSnapshot(statusAnterior),
                statusSnapshot(pedido.getStatus())
        );

        return Map.of("status", pedido.getStatus().name());
    }

    public Map<String, Object> entregarPedido(Long pedidoId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> {
                    log.warn("[ADMIN-WORKFLOW] Pedido não encontrado - PedidoID: {}", pedidoId);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido não encontrado");
                });
        StatusPedido statusAnterior = pedido.getStatus();
        if (pedido.getStatus() != StatusPedido.EM_TRANSITO) {
            log.warn("[ADMIN-WORKFLOW] Validação falhou ao entregar - PedidoID: {} - Status atual: {} - Esperado: EM_TRANSITO", 
                    pedidoId, pedido.getStatus());
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Apenas pedidos EM_TRANSITO podem ser marcados como entregues"
            );
        }
        pedido.setStatus(StatusPedido.ENTREGUE);
        pedidoRepository.save(pedido);

        String clienteEmail = pedido.getCliente() != null ? pedido.getCliente().getEmail() : "desconhecido";
        log.info("[ADMIN-WORKFLOW] Pedido entregue - PedidoID: {} - Cliente: {}", pedidoId, clienteEmail);

        if (pedido.getCliente() != null) {
            notificacaoService.criar(
                    pedido.getCliente(),
                    "Pedido entregue",
                    "Seu pedido PED-" + pedido.getId() + " foi entregue.",
                    "/account/orders",
                    "PEDIDO_ENTREGUE"
            );
        }

        transacaoLogService.registrar(
                "PEDIDO",
                pedido.getId(),
                OperacaoLog.UPDATE,
                statusSnapshot(statusAnterior),
                statusSnapshot(pedido.getStatus())
        );

        return Map.of("status", pedido.getStatus().name());
    }

    public Map<String, Object> confirmarPagamento(Long pedidoId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> {
                    log.warn("[ADMIN-WORKFLOW] Pedido não encontrado - PedidoID: {}", pedidoId);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido não encontrado");
                });

        if (pedido.getStatus() != StatusPedido.APROVADA) {
            log.warn("[ADMIN-WORKFLOW] Validação falhou ao confirmar pagamento - PedidoID: {} - Status atual: {}", 
                    pedidoId, pedido.getStatus());
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Apenas pedidos APROVADA podem ter pagamento confirmado"
            );
        }

        if (Boolean.TRUE.equals(pedido.getPagamentoConfirmado())) {
            return Map.of("pagamentoConfirmado", true);
        }

        Map<String, Object> before = Map.of("pagamentoConfirmado", pedido.getPagamentoConfirmado());
        pedido.setPagamentoConfirmado(true);
        pedidoRepository.save(pedido);

        transacaoLogService.registrar(
                "PEDIDO",
                pedido.getId(),
                OperacaoLog.UPDATE,
                before,
                Map.of("pagamentoConfirmado", true)
        );

        return Map.of("pagamentoConfirmado", true);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<Map<String, Object>> getClientes(
            String nome,
            String cpf,
            String email,
            Boolean ativo,
            Pageable pageable
    ) {
        String cpfNormalizado = cpf == null ? null : cpf.replaceAll("\\D", "");
        Page<Cliente> page = clienteRepository.search(
                normalizeString(nome),
                normalizeString(cpfNormalizado),
                normalizeString(email),
                ativo,
                pageable
        );
        Page<Map<String, Object>> mapped = page.map(this::toClienteResumoResponse);
        return new PaginatedResponse<>(mapped);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCliente(Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("[ADMIN-WORKFLOW] Cliente não encontrado - ClienteID: {}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado");
                });
        return toClienteDetalheResponse(cliente);
    }

    public Map<String, Object> inativarCliente(Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("[ADMIN-WORKFLOW] Cliente não encontrado para inativar - ClienteID: {}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado");
                });
        Map<String, Object> snapshotAnterior = toClienteStatusSnapshot(cliente);
        cliente.setAtivo(false);
        Cliente saved = clienteRepository.save(cliente);
        
        log.info("[ADMIN-WORKFLOW] Cliente inativado - ClienteID: {} - Email: {}", 
                saved.getId(), saved.getEmail());
        
        transacaoLogService.registrar(
                "CLIENTE",
                saved.getId(),
                OperacaoLog.UPDATE,
                snapshotAnterior,
                toClienteStatusSnapshot(saved)
        );
        return Map.of("id", saved.getId(), "ativo", saved.getAtivo());
    }

    public Map<String, Object> ativarCliente(Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("[ADMIN-WORKFLOW] Cliente não encontrado para ativar - ClienteID: {}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado");
                });
        Map<String, Object> snapshotAnterior = toClienteStatusSnapshot(cliente);
        cliente.setAtivo(true);
        Cliente saved = clienteRepository.save(cliente);
        
        log.info("[ADMIN-WORKFLOW] Cliente ativado - ClienteID: {} - Email: {}", 
                saved.getId(), saved.getEmail());
        
        transacaoLogService.registrar(
                "CLIENTE",
                saved.getId(),
                OperacaoLog.UPDATE,
                snapshotAnterior,
                toClienteStatusSnapshot(saved)
        );
        return Map.of("id", saved.getId(), "ativo", saved.getAtivo());
    }

    public Map<String, Object> excluirCliente(Long id) {
        log.info("[ADMIN-WORKFLOW] Iniciando exclusão de cliente - ClienteID: {}", id);
        
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("[ADMIN-WORKFLOW] Cliente não encontrado para exclusão - ClienteID: {}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado");
                });

        validateClienteSemDependenciasParaExclusao(id);

        String clienteEmail = cliente.getEmail();
        String clienteNome = cliente.getNome();
        Map<String, Object> snapshotAnterior = toClienteDeleteSnapshot(cliente);
        
        log.info("[ADMIN-WORKFLOW] Removendo dados relacionados ao cliente - ClienteID: {} - Email: {}", id, clienteEmail);
        itemCarrinhoRepository.deleteAllByClienteIdQuery(id);
        carrinhoCompraRepository.deleteAllByClienteId(id);
        
        log.info("[ADMIN-WORKFLOW] Executando exclusão do cliente - ClienteID: {} - Nome: {} - Email: {}", 
                id, clienteNome, clienteEmail);
        clienteRepository.delete(cliente);
        
        log.info("[ADMIN-WORKFLOW] Cliente excluído com sucesso - ClienteID: {} - Email: {}", id, clienteEmail);
        
        transacaoLogService.registrar(
                "CLIENTE",
                id,
                OperacaoLog.UPDATE,
                snapshotAnterior,
                null
        );
        return Map.of("id", id, "excluido", true);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<Map<String, Object>> getAvaliacoes(Boolean aprovada, Pageable pageable) {
        Page<Avaliacao> page = aprovada == null
                ? avaliacaoRepository.findAll(pageable)
                : avaliacaoRepository.findByAprovada(aprovada, pageable);
        Page<Map<String, Object>> mapped = page.map(this::toAvaliacaoAdminResponse);
        return new PaginatedResponse<>(mapped);
    }

    public Map<String, Object> aprovarAvaliacao(Long avaliacaoId) {
        Avaliacao avaliacao = avaliacaoRepository.findById(avaliacaoId)
                .orElseThrow(() -> {
                    log.warn("[ADMIN-WORKFLOW] Avaliação não encontrada - AvaliacaoID: {}", avaliacaoId);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Avaliação não encontrada");
                });
        avaliacao.setAprovada(true);
        avaliacaoRepository.save(avaliacao);

        String clienteEmail = avaliacao.getCliente() != null ? avaliacao.getCliente().getEmail() : "desconhecido";
        String livroTitulo = avaliacao.getLivro() != null ? avaliacao.getLivro().getTitulo() : "desconhecido";
        log.info("[ADMIN-WORKFLOW] Avaliação aprovada - AvaliacaoID: {} - Cliente: {} - Livro: {}", 
                avaliacaoId, clienteEmail, livroTitulo);

        if (avaliacao.getCliente() != null && avaliacao.getLivro() != null) {
            notificacaoService.criar(
                    avaliacao.getCliente(),
                    "Avaliação aprovada",
                    "Sua avaliação do livro \"" + avaliacao.getLivro().getTitulo() + "\" foi aprovada.",
                    "/product/" + avaliacao.getLivro().getId(),
                    "AVALIACAO_APROVADA"
            );
        }

        return Map.of("aprovada", true);
    }

    public Map<String, Object> rejeitarAvaliacao(Long avaliacaoId) {
        Avaliacao avaliacao = avaliacaoRepository.findById(avaliacaoId)
                .orElseThrow(() -> {
                    log.warn("[ADMIN-WORKFLOW] Avaliação não encontrada - AvaliacaoID: {}", avaliacaoId);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Avaliação não encontrada");
                });
        avaliacao.setAprovada(false);
        avaliacaoRepository.save(avaliacao);

        String clienteEmail = avaliacao.getCliente() != null ? avaliacao.getCliente().getEmail() : "desconhecido";
        String livroTitulo = avaliacao.getLivro() != null ? avaliacao.getLivro().getTitulo() : "desconhecido";
        log.info("[ADMIN-WORKFLOW] Avaliação rejeitada - AvaliacaoID: {} - Cliente: {} - Livro: {}", 
                avaliacaoId, clienteEmail, livroTitulo);

        if (avaliacao.getCliente() != null && avaliacao.getLivro() != null) {
            notificacaoService.criar(
                    avaliacao.getCliente(),
                    "Avaliação reprovada",
                    "Sua avaliação do livro \"" + avaliacao.getLivro().getTitulo() + "\" não foi aprovada.",
                    "/product/" + avaliacao.getLivro().getId(),
                    "AVALIACAO_REJEITADA"
            );
        }

        return Map.of("aprovada", false);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<Map<String, Object>> getTrocas(String status, Pageable pageable) {
        StatusTroca statusTroca = parseStatusTroca(status);
        Page<SolicitacaoTroca> page = statusTroca == null
                ? solicitacaoTrocaRepository.findAll(pageable)
                : solicitacaoTrocaRepository.findByStatus(statusTroca, pageable);
        Page<Map<String, Object>> mapped = page.map(this::toTrocaResponse);
        return new PaginatedResponse<>(mapped);
    }

    public Map<String, Object> autorizarTroca(Long trocaId) {
        SolicitacaoTroca troca = solicitacaoTrocaRepository.findById(trocaId)
                .orElseThrow(() -> {
                    log.warn("[ADMIN-WORKFLOW] Troca não encontrada - TrocaID: {}", trocaId);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Troca não encontrada");
                });
        StatusTroca statusAnteriorTroca = troca.getStatus();
        if (troca.getStatus() != StatusTroca.EM_TROCA) {
            log.warn("[ADMIN-WORKFLOW] Validação falhou - TrocaID: {} - Status atual: {} - Esperado: EM_TROCA", 
                    trocaId, troca.getStatus());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Troca deve estar EM_TROCA");
        }
        troca.setStatus(StatusTroca.TROCA_AUTORIZADA);
        solicitacaoTrocaRepository.save(troca);

        String clienteEmail = troca.getPedido() != null && troca.getPedido().getCliente() != null 
                ? troca.getPedido().getCliente().getEmail() : "desconhecido";
        log.info("[ADMIN-WORKFLOW] Troca autorizada - TrocaID: {} - Cliente: {} - PedidoID: {}", 
                trocaId, clienteEmail, troca.getPedido() != null ? troca.getPedido().getId() : null);

        transacaoLogService.registrar(
                "SOLICITACAO_TROCA",
                troca.getId(),
                OperacaoLog.UPDATE,
                statusSnapshot(statusAnteriorTroca),
                statusSnapshot(troca.getStatus())
        );

        Pedido pedido = troca.getPedido();
        if (pedido != null) {
            StatusPedido statusAnteriorPedido = pedido.getStatus();
            pedido.setStatus(StatusPedido.TROCA_AUTORIZADA);
            pedidoRepository.save(pedido);
            transacaoLogService.registrar(
                    "PEDIDO",
                    pedido.getId(),
                    OperacaoLog.UPDATE,
                    statusSnapshot(statusAnteriorPedido),
                    statusSnapshot(pedido.getStatus())
            );
            if (pedido.getCliente() != null) {
                notificacaoService.criar(
                        pedido.getCliente(),
                        "Troca autorizada",
                        "Sua solicitação de troca do pedido PED-" + pedido.getId() + " foi autorizada.",
                        "/account/orders",
                        "TROCA_AUTORIZADA"
                );
            }
        }

        return Map.of("status", StatusTroca.TROCA_AUTORIZADA.name());
    }

    public Map<String, Object> rejeitarTroca(Long trocaId) {
        SolicitacaoTroca troca = solicitacaoTrocaRepository.findById(trocaId)
                .orElseThrow(() -> {
                    log.warn("[ADMIN-WORKFLOW] Troca não encontrada - TrocaID: {}", trocaId);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Troca não encontrada");
                });
        StatusTroca statusAnteriorTroca = troca.getStatus();
        if (troca.getStatus() != StatusTroca.EM_TROCA) {
            log.warn("[ADMIN-WORKFLOW] Validação falhou ao rejeitar - TrocaID: {} - Status atual: {}", 
                    trocaId, troca.getStatus());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Troca deve estar EM_TROCA");
        }

        troca.setStatus(StatusTroca.REJEITADA);
        solicitacaoTrocaRepository.save(troca);

        transacaoLogService.registrar(
                "SOLICITACAO_TROCA",
                troca.getId(),
                OperacaoLog.UPDATE,
                statusSnapshot(statusAnteriorTroca),
                statusSnapshot(troca.getStatus())
        );

        Pedido pedido = troca.getPedido();
        if (pedido != null) {
            StatusPedido statusAnteriorPedido = pedido.getStatus();
            pedido.setStatus(StatusPedido.ENTREGUE);
            pedidoRepository.save(pedido);
            transacaoLogService.registrar(
                    "PEDIDO",
                    pedido.getId(),
                    OperacaoLog.UPDATE,
                    statusSnapshot(statusAnteriorPedido),
                    statusSnapshot(pedido.getStatus())
            );

            if (pedido.getCliente() != null) {
                notificacaoService.criar(
                        pedido.getCliente(),
                        "Troca rejeitada",
                        "Sua solicitação de troca do pedido PED-" + pedido.getId() + " foi rejeitada.",
                        "/account/orders",
                        "TROCA_REJEITADA"
                );
            }
        }

        return Map.of("status", StatusTroca.REJEITADA.name());
    }

    public Map<String, Object> confirmarRecebimentoTroca(Long trocaId, Map<String, Object> payload) {
        SolicitacaoTroca troca = solicitacaoTrocaRepository.findById(trocaId)
                .orElseThrow(() -> {
                    log.warn("[ADMIN-WORKFLOW] Troca não encontrada - TrocaID: {}", trocaId);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Troca não encontrada");
                });
        StatusTroca statusAnteriorTroca = troca.getStatus();
        if (troca.getStatus() != StatusTroca.TROCA_AUTORIZADA) {
            log.warn("[ADMIN-WORKFLOW] Validação falhou - TrocaID: {} - Status atual: {} - Esperado: TROCA_AUTORIZADA", 
                    trocaId, troca.getStatus());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Troca deve estar TROCA_AUTORIZADA");
        }

        Map<Long, Boolean> retornoMap = new HashMap<>();
        for (Map<String, Object> itemPayload : asListOfMaps(payload.get("itens"))) {
            Long itemId = asLong(itemPayload.get("id"));
            if (itemId != null) {
                retornoMap.put(itemId, asBoolean(itemPayload.get("retornarAoEstoque"), true));
            }
        }

        BigDecimal valorCupom = BigDecimal.ZERO;
        List<ItemTroca> itens = troca.getItensDevolvidos() == null ? List.of() : troca.getItensDevolvidos();
        for (ItemTroca itemTroca : itens) {
            boolean retornarAoEstoque = retornoMap.getOrDefault(itemTroca.getId(), true);
            itemTroca.setRetornarAoEstoque(retornarAoEstoque);

            ItemPedido itemPedido = itemTroca.getItemPedido();
            if (itemPedido == null) continue;

            Integer quantidade = itemTroca.getQuantidade() == null ? 0 : itemTroca.getQuantidade();
            BigDecimal valorUnitario = itemPedido.getValorUnitario() == null ? BigDecimal.ZERO : itemPedido.getValorUnitario();
            valorCupom = valorCupom.add(valorUnitario.multiply(BigDecimal.valueOf(quantidade)));

            if (retornarAoEstoque && itemPedido.getLivro() != null && itemPedido.getLivro().getId() != null) {
                Estoque estoque = estoqueRepository.findByLivroId(itemPedido.getLivro().getId()).orElseGet(() -> {
                    Estoque novo = new Estoque();
                    novo.setLivro(itemPedido.getLivro());
                    novo.setQuantidadeTotal(0);
                    novo.setQuantidadeDisponivel(0);
                    novo.setQuantidadeBloqueada(0);
                    return novo;
                });
                int bloqueado = safeInt(estoque.getQuantidadeBloqueada());
                int total = safeInt(estoque.getQuantidadeTotal()) + quantidade;
                estoque.setQuantidadeTotal(total);
                estoque.setQuantidadeBloqueada(bloqueado);
                estoque.setQuantidadeDisponivel(Math.max(0, total - bloqueado));
                estoqueRepository.save(estoque);
            }
        }

        troca.setStatus(StatusTroca.TROCADO);
        solicitacaoTrocaRepository.save(troca);
        transacaoLogService.registrar(
                "SOLICITACAO_TROCA",
                troca.getId(),
                OperacaoLog.UPDATE,
                statusSnapshot(statusAnteriorTroca),
                statusSnapshot(troca.getStatus())
        );

        Pedido pedido = troca.getPedido();
        String clienteEmail = pedido != null && pedido.getCliente() != null 
                ? pedido.getCliente().getEmail() : "desconhecido";
        String cupomCodigo = null;
        
        if (pedido != null) {
            StatusPedido statusAnteriorPedido = pedido.getStatus();
            pedido.setStatus(StatusPedido.TROCADO);
            pedidoRepository.save(pedido);
            transacaoLogService.registrar(
                    "PEDIDO",
                    pedido.getId(),
                    OperacaoLog.UPDATE,
                    statusSnapshot(statusAnteriorPedido),
                    statusSnapshot(pedido.getStatus())
            );
            if (pedido.getCliente() != null && valorCupom.compareTo(BigDecimal.ZERO) > 0) {
                CupomTroca cupomTroca = new CupomTroca();
                cupomTroca.setCliente(pedido.getCliente());
                cupomTroca.setPedidoOrigem(pedido);
                cupomTroca.setValor(valorCupom);
                cupomTroca.setUtilizado(false);
                cupomTroca.setDataGeracao(LocalDateTime.now());
                cupomTrocaRepository.save(cupomTroca);
                cupomCodigo = "CUPOM-" + cupomTroca.getId();
                
                log.info("[ADMIN-WORKFLOW] Troca finalizada - TrocaID: {} - Cliente: {} - Cupom gerado: {} - Valor: {}", 
                        trocaId, clienteEmail, cupomCodigo, valorCupom);
                
                transacaoLogService.registrar(
                        "CUPOM_TROCA",
                        cupomTroca.getId(),
                        OperacaoLog.INSERT,
                        null,
                        Map.of(
                                "clienteId", pedido.getCliente().getId(),
                                "pedidoOrigemId", pedido.getId(),
                                "valor", cupomTroca.getValor()
                        )
                );

                notificacaoService.criar(
                        pedido.getCliente(),
                        "Troca finalizada",
                        "Recebemos os itens da troca do pedido PED-" + pedido.getId()
                                + ". Um cupom de R$ " + valorCupom + " foi gerado.",
                        "/checkout",
                        "TROCA_FINALIZADA"
                );
            }
        }

        if (cupomCodigo == null) {
            log.info("[ADMIN-WORKFLOW] Troca finalizada sem cupom - TrocaID: {} - Cliente: {}", 
                    trocaId, clienteEmail);
        }

        return Map.of("status", StatusTroca.TROCADO.name());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAnaliseVendas(String dataInicio, String dataFim, String agrupamento) {
        LocalDate inicio = parseDate(dataInicio, "dataInicio");
        LocalDate fim = parseDate(dataFim, "dataFim");
        if (fim.isBefore(inicio)) {
            log.warn("[ADMIN-WORKFLOW] Validação de data falhou em análise de vendas - DataInicio: {} - DataFim: {}", 
                    inicio, fim);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Data fim deve ser maior ou igual à data início");
        }

        List<Pedido> pedidos = pedidoRepository.findByDataPedidoBetween(
                inicio.atStartOfDay(),
                fim.plusDays(1).atStartOfDay().minusNanos(1)
        );
        pedidos = pedidos.stream().filter(this::isPedidoAprovado).toList();

        boolean agruparPorProduto = "PRODUTO".equalsIgnoreCase(agrupamento);
        Map<String, Map<YearMonth, Aggregate>> seriesMap = new HashMap<>();

        for (Pedido pedido : pedidos) {
            YearMonth mes = YearMonth.from(pedido.getDataPedido());
            for (ItemPedido item : safeItems(pedido.getItens())) {
                String nomeSerie = agruparPorProduto
                        ? safeLivroTitulo(item)
                        : firstCategoriaNome(item);
                if (nomeSerie == null || nomeSerie.isBlank()) continue;

                Map<YearMonth, Aggregate> bucket = seriesMap.computeIfAbsent(nomeSerie, k -> new HashMap<>());
                Aggregate aggregate = bucket.computeIfAbsent(mes, m -> new Aggregate());
                int quantidade = item.getQuantidade() == null ? 0 : item.getQuantidade();
                BigDecimal valorUnitario = item.getValorUnitario() == null ? BigDecimal.ZERO : item.getValorUnitario();
                aggregate.quantidade += quantidade;
                aggregate.valor = aggregate.valor.add(valorUnitario.multiply(BigDecimal.valueOf(quantidade)));
            }
        }

        List<Map<String, Object>> series = seriesMap.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    List<Map<String, Object>> data = entry.getValue().entrySet().stream()
                            .sorted(Map.Entry.comparingByKey())
                            .map(monthEntry -> {
                                Map<String, Object> ponto = new HashMap<>();
                                ponto.put("mes", monthEntry.getKey().toString());
                                ponto.put("quantidade", monthEntry.getValue().quantidade);
                                ponto.put("valor", monthEntry.getValue().valor);
                                return ponto;
                            })
                            .toList();
                    Map<String, Object> serie = new HashMap<>();
                    serie.put("nome", entry.getKey());
                    serie.put("data", data);
                    return serie;
                })
                .toList();

        Map<String, Object> periodo = Map.of("dataInicio", inicio.toString(), "dataFim", fim.toString());
        Map<String, Object> response = new HashMap<>();
        response.put("periodo", periodo);
        response.put("series", series);
        return response;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAnaliseVendasRegiao(String dataInicio, String dataFim) {
        LocalDate inicio = parseDate(dataInicio, "dataInicio");
        LocalDate fim = parseDate(dataFim, "dataFim");
        if (fim.isBefore(inicio)) {
            log.warn("[ADMIN-WORKFLOW] Validação de data falhou em análise por região - DataInicio: {} - DataFim: {}", 
                    inicio, fim);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Data fim deve ser maior ou igual à data início");
        }

        List<Pedido> pedidos = pedidoRepository.findByDataPedidoBetween(
                inicio.atStartOfDay(),
                fim.plusDays(1).atStartOfDay().minusNanos(1)
        );
        pedidos = pedidos.stream().filter(this::isPedidoAprovado).toList();

        Map<String, Aggregate> porEstado = new HashMap<>();
        for (Pedido pedido : pedidos) {
            String estado = extractEstado(pedido.getEnderecoEntrega());
            Aggregate aggregate = porEstado.computeIfAbsent(estado, k -> new Aggregate());
            aggregate.quantidade += safeItems(pedido.getItens()).stream()
                    .map(ItemPedido::getQuantidade)
                    .filter(q -> q != null && q > 0)
                    .reduce(0, Integer::sum);
            aggregate.valor = aggregate.valor.add(pedido.getValorTotal() == null ? BigDecimal.ZERO : pedido.getValorTotal());
        }

        List<Map<String, Object>> estados = porEstado.entrySet().stream()
                .sorted(Comparator.comparing((Map.Entry<String, Aggregate> e) -> e.getValue().quantidade).reversed())
                .map(entry -> {
                    Map<String, Object> estado = new HashMap<>();
                    estado.put("estado", entry.getKey());
                    estado.put("quantidade", entry.getValue().quantidade);
                    estado.put("valor", entry.getValue().valor);
                    return estado;
                })
                .toList();

        Map<String, Object> periodo = Map.of("dataInicio", inicio.toString(), "dataFim", fim.toString());
        Map<String, Object> response = new HashMap<>();
        response.put("periodo", periodo);
        response.put("estados", estados);
        return response;
    }

    private Map<String, Object> toPedidoResponse(Pedido pedido) {
        Map<String, Object> cliente = null;
        if (pedido.getCliente() != null) {
            cliente = new HashMap<>();
            cliente.put("id", pedido.getCliente().getId());
            cliente.put("nome", pedido.getCliente().getNome());
            cliente.put("email", pedido.getCliente().getEmail());
        }

        List<Map<String, Object>> itens = safeItems(pedido.getItens()).stream()
                .map(item -> {
                    Map<String, Object> it = new HashMap<>();
                    it.put("id", item.getId());
                    it.put("livroId", item.getLivro() != null ? item.getLivro().getId() : null);
                    it.put("titulo", safeLivroTitulo(item));
                    it.put("quantidade", item.getQuantidade());
                    it.put("valorUnitario", item.getValorUnitario());
                    if (item.getValorUnitario() != null && item.getQuantidade() != null) {
                        it.put("subtotal", item.getValorUnitario().multiply(BigDecimal.valueOf(item.getQuantidade())));
                    }
                    return it;
                })
                .toList();

        Map<String, Object> map = new HashMap<>();
        map.put("id", pedido.getId());
        map.put("numero", "PED-" + String.format("%03d", pedido.getId()));
        map.put("dataPedido", pedido.getDataPedido());
        map.put("status", pedido.getStatus() != null ? pedido.getStatus().name() : null);
        map.put("pagamentoConfirmado", pedido.getPagamentoConfirmado());
        map.put("cliente", cliente);
        map.put("valorTotal", pedido.getValorTotal());
        map.put("valorFrete", pedido.getValorFrete());
        map.put("itens", itens);
        map.put("enderecoEntrega", parseEndereco(pedido.getEnderecoEntrega()));
        return map;
    }

    private Map<String, Object> toClienteResumoResponse(Cliente cliente) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", cliente.getId());
        map.put("nome", cliente.getNome());
        map.put("cpf", cliente.getCpf());
        map.put("email", cliente.getEmail());
        map.put("ranking", cliente.getRanking());
        map.put("ativo", cliente.getAtivo());
        map.put("dataCadastro", null);
        return map;
    }

    private Map<String, Object> toClienteDetalheResponse(Cliente cliente) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", cliente.getId());
        map.put("nome", cliente.getNome());
        map.put("cpf", cliente.getCpf());
        map.put("email", cliente.getEmail());
        map.put("genero", cliente.getGenero());
        map.put("dataNascimento", cliente.getDataNascimento());
        map.put("ranking", cliente.getRanking());
        map.put("ativo", cliente.getAtivo());
        map.put("dataCadastro", null);

        List<Map<String, Object>> enderecos = safeEnderecos(cliente.getEnderecos()).stream()
                .map(this::toEnderecoResponse)
                .toList();
        map.put("enderecos", enderecos);

        List<Map<String, Object>> cartoes = safeCartoes(cliente.getCartoes()).stream()
                .map(this::toCartaoResponse)
                .toList();
        map.put("cartoes", cartoes);

        List<Map<String, Object>> transacoes = pedidoRepository
                .findByClienteId(cliente.getId(), PageRequest.of(0, 200))
                .getContent()
                .stream()
                .map(this::toTransacaoResumo)
                .toList();
        map.put("transacoes", transacoes);
        return map;
    }

    private Map<String, Object> toClienteStatusSnapshot(Cliente cliente) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("id", cliente.getId());
        snapshot.put("ativo", cliente.getAtivo());
        snapshot.put("nome", cliente.getNome());
        snapshot.put("email", cliente.getEmail());
        return snapshot;
    }

    private Map<String, Object> toClienteDeleteSnapshot(Cliente cliente) {
        Map<String, Object> snapshot = toClienteStatusSnapshot(cliente);
        snapshot.put("cpf", cliente.getCpf());
        snapshot.put("ranking", cliente.getRanking());
        return snapshot;
    }

    private void validateClienteSemDependenciasParaExclusao(Long clienteId) {
        List<String> dependencias = new ArrayList<>();
        if (pedidoRepository.existsByClienteId(clienteId)) {
            dependencias.add("pedidos");
        }
        if (avaliacaoRepository.existsByClienteId(clienteId)) {
            dependencias.add("avaliações");
        }
        if (carrinhoCompraRepository.existsItemsByClienteId(clienteId)) {
            dependencias.add("carrinho");
        }
        if (!cupomTrocaRepository.findByClienteId(clienteId).isEmpty()) {
            dependencias.add("cupons de troca");
        }
        if (notificacaoRepository.existsByClienteId(clienteId)) {
            dependencias.add("notificações");
        }
        if (!dependencias.isEmpty()) {
            String deps = String.join(", ", dependencias);
            log.warn("[ADMIN-WORKFLOW] Tentativa de excluir cliente com dependências - ClienteID: {} - Dependências: {}", 
                    clienteId, deps);
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Não é possível excluir cliente com vínculos: " + deps
            );
        }
    }

    private Map<String, Object> toEnderecoResponse(Endereco endereco) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", endereco.getId());
        map.put("apelido", endereco.getApelido());
        map.put("logradouro", endereco.getLogradouro());
        map.put("numero", endereco.getNumero());
        map.put("complemento", endereco.getObservacoes());
        map.put("bairro", endereco.getBairro());
        map.put("cidade", endereco.getCidade());
        map.put("estado", endereco.getEstado());
        map.put("cep", endereco.getCep());
        map.put("principal", false);
        return map;
    }

    private Map<String, Object> toCartaoResponse(CartaoCredito cartao) {
        String numero = cartao.getNumero() == null ? "" : cartao.getNumero().replaceAll("\\D", "");
        String ultimosDigitos = numero.length() <= 4 ? numero : numero.substring(numero.length() - 4);

        Map<String, Object> map = new HashMap<>();
        map.put("id", cartao.getId());
        map.put("ultimosDigitos", ultimosDigitos);
        map.put("nomeTitular", cartao.getNomeImpresso());
        map.put("principal", Boolean.TRUE.equals(cartao.getPreferencial()));
        map.put("mesValidade", null);
        map.put("anoValidade", null);
        return map;
    }

    private Map<String, Object> toTransacaoResumo(Pedido pedido) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", pedido.getId());
        map.put("pedidoId", pedido.getId());
        map.put("data", pedido.getDataPedido());
        map.put("valor", pedido.getValorTotal());
        map.put("status", pedido.getStatus() != null ? pedido.getStatus().name() : null);
        return map;
    }

    private Map<String, Object> toAvaliacaoAdminResponse(Avaliacao avaliacao) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", avaliacao.getId());
        map.put("livroId", avaliacao.getLivro() != null ? avaliacao.getLivro().getId() : null);
        map.put("livroTitulo", avaliacao.getLivro() != null ? avaliacao.getLivro().getTitulo() : null);
        map.put("clienteId", avaliacao.getCliente() != null ? avaliacao.getCliente().getId() : null);
        map.put("clienteNome", avaliacao.getCliente() != null ? avaliacao.getCliente().getNome() : null);
        map.put("estrelas", avaliacao.getEstrelas());
        map.put("texto", avaliacao.getTexto());
        map.put("dataAvaliacao", avaliacao.getDataAvaliacao());
        map.put("aprovada", avaliacao.getAprovada());
        return map;
    }

    private Map<String, Object> toTrocaResponse(SolicitacaoTroca troca) {
        List<Map<String, Object>> itens = (troca.getItensDevolvidos() == null ? List.<ItemTroca>of() : troca.getItensDevolvidos())
                .stream()
                .map(itemTroca -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", itemTroca.getId());
                    map.put("livroTitulo",
                            itemTroca.getItemPedido() != null && itemTroca.getItemPedido().getLivro() != null
                                    ? itemTroca.getItemPedido().getLivro().getTitulo()
                                    : null
                    );
                    map.put("quantidade", itemTroca.getQuantidade());
                    map.put("justificativa", itemTroca.getJustificativa());
                    map.put("retornarAoEstoque", itemTroca.getRetornarAoEstoque());
                    return map;
                })
                .toList();

        Map<String, Object> map = new HashMap<>();
        map.put("id", troca.getId());
        map.put("pedidoId", troca.getPedido() != null ? troca.getPedido().getId() : null);
        map.put("numeroNota", troca.getPedido() != null ? "PED-" + troca.getPedido().getId() : null);
        map.put("status", troca.getStatus() != null ? troca.getStatus().name() : null);
        map.put("dataSolicitacao", troca.getDataSolicitacao());
        map.put("itens", itens);
        return map;
    }

    private String firstCategoriaNome(ItemPedido item) {
        if (item.getLivro() == null || item.getLivro().getCategorias() == null || item.getLivro().getCategorias().isEmpty()) {
            return "Sem categoria";
        }
        return item.getLivro().getCategorias().stream()
                .map(categoria -> categoria.getNome())
                .filter(nome -> nome != null && !nome.isBlank())
                .findFirst()
                .orElse("Sem categoria");
    }

    private String safeLivroTitulo(ItemPedido item) {
        return item.getLivro() != null ? item.getLivro().getTitulo() : null;
    }

    private String extractEstado(String enderecoEntrega) {
        if (enderecoEntrega == null || enderecoEntrega.isBlank()) return "N/I";
        String[] parts = enderecoEntrega.split(",");
        if (parts.length >= 5) {
            String estado = parts[4].trim().toUpperCase(Locale.ROOT);
            if (!estado.isBlank()) return estado;
        }
        return "N/I";
    }

    private StatusPedido parseStatusPedido(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) return null;
        try {
            String normalized = rawStatus.trim().toUpperCase(Locale.ROOT);
            if ("CANCELADA".equals(normalized)) {
                return StatusPedido.REPROVADA;
            }
            return StatusPedido.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            log.warn("[ADMIN-WORKFLOW] Status de pedido inválido: {}", rawStatus);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status de pedido inválido");
        }
    }

    private StatusTroca parseStatusTroca(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) return null;
        try {
            return StatusTroca.valueOf(rawStatus.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            log.warn("[ADMIN-WORKFLOW] Status de troca inválido: {}", rawStatus);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status de troca inválido");
        }
    }

    private LocalDate parseDate(String raw, String field) {
        try {
            return LocalDate.parse(raw);
        } catch (Exception ex) {
            log.warn("[ADMIN-WORKFLOW] Data inválida - Campo: {} - Valor: {}", field, raw);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " inválida");
        }
    }

    private boolean isPedidoAprovado(Pedido pedido) {
        if (pedido.getStatus() == null) return false;
        Set<StatusPedido> validos = new HashSet<>(Set.of(
                StatusPedido.APROVADA,
                StatusPedido.EM_TRANSITO,
                StatusPedido.ENTREGUE,
                StatusPedido.EM_TROCA,
                StatusPedido.TROCA_AUTORIZADA,
                StatusPedido.TROCADO
        ));
        return validos.contains(pedido.getStatus());
    }

    private List<ItemPedido> safeItems(List<ItemPedido> itens) {
        return itens == null ? List.of() : itens;
    }

    private List<Endereco> safeEnderecos(List<Endereco> enderecos) {
        return enderecos == null ? List.of() : enderecos;
    }

    private List<CartaoCredito> safeCartoes(List<CartaoCredito> cartoes) {
        return cartoes == null ? List.of() : cartoes;
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

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> asListOfMaps(Object value) {
        if (!(value instanceof List<?> list)) return List.of();
        return list.stream()
                .filter(item -> item instanceof Map<?, ?>)
                .map(item -> {
                    Map<String, Object> map = new HashMap<>();
                    ((Map<?, ?>) item).forEach((k, v) -> map.put(String.valueOf(k), v));
                    return map;
                })
                .collect(Collectors.toList());
    }

    private Long asLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.longValue();
        try {
            return Long.parseLong(String.valueOf(value).trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Boolean asBoolean(Object value, boolean defaultValue) {
        if (value == null) return defaultValue;
        if (value instanceof Boolean bool) return bool;
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private String normalizeString(String value) {
        if (value == null) return null;
        String text = value.trim();
        return text.isEmpty() ? null : text;
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private Map<String, Object> statusSnapshot(Enum<?> status) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("status", status != null ? status.name() : null);
        return snapshot;
    }

    private static class Aggregate {
        private int quantidade = 0;
        private BigDecimal valor = BigDecimal.ZERO;
    }
}
