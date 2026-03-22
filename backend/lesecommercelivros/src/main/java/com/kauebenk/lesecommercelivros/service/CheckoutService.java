package com.kauebenk.lesecommercelivros.service;

import com.kauebenk.lesecommercelivros.entity.CarrinhoCompra;
import com.kauebenk.lesecommercelivros.entity.CartaoCredito;
import com.kauebenk.lesecommercelivros.entity.Cliente;
import com.kauebenk.lesecommercelivros.entity.CupomPromocional;
import com.kauebenk.lesecommercelivros.entity.CupomTroca;
import com.kauebenk.lesecommercelivros.entity.Endereco;
import com.kauebenk.lesecommercelivros.entity.Estoque;
import com.kauebenk.lesecommercelivros.entity.FormaPagamento;
import com.kauebenk.lesecommercelivros.entity.ItemCarrinho;
import com.kauebenk.lesecommercelivros.entity.ItemPedido;
import com.kauebenk.lesecommercelivros.entity.Pedido;
import com.kauebenk.lesecommercelivros.entity.enums.OperacaoLog;
import com.kauebenk.lesecommercelivros.entity.enums.StatusPedido;
import com.kauebenk.lesecommercelivros.entity.enums.TipoPagamento;
import com.kauebenk.lesecommercelivros.repository.CarrinhoCompraRepository;
import com.kauebenk.lesecommercelivros.repository.CartaoCreditoRepository;
import com.kauebenk.lesecommercelivros.repository.ClienteRepository;
import com.kauebenk.lesecommercelivros.repository.CupomPromocionalRepository;
import com.kauebenk.lesecommercelivros.repository.CupomTrocaRepository;
import com.kauebenk.lesecommercelivros.repository.EnderecoRepository;
import com.kauebenk.lesecommercelivros.repository.EstoqueRepository;
import com.kauebenk.lesecommercelivros.repository.ItemCarrinhoRepository;
import com.kauebenk.lesecommercelivros.repository.PedidoRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@Transactional
public class CheckoutService {

    private static final BigDecimal MINIMO_CARTAO = BigDecimal.TEN;
    private static final String PARAM_FRETE_BASE = "FRETE_BASE_VALOR";
    private static final String PARAM_FRETE_POR_ITEM = "FRETE_POR_ITEM_VALOR";
    private static final String PARAM_CART_TTL_MINUTOS = "CARRINHO_TTL_MINUTOS";

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private CarrinhoCompraRepository carrinhoRepository;

    @Autowired
    private ItemCarrinhoRepository itemCarrinhoRepository;

    @Autowired
    private EnderecoRepository enderecoRepository;

    @Autowired
    private CartaoCreditoRepository cartaoRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private EstoqueRepository estoqueRepository;

    @Autowired
    private CupomTrocaRepository cupomTrocaRepository;

    @Autowired
    private CupomPromocionalRepository cupomPromocionalRepository;

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private ParametroSistemaService parametroSistemaService;

    @Autowired
    private TransacaoLogService transacaoLogService;

    public Map<String, Object> calcularFrete(Map<String, Object> req) {
        Cliente cliente = getAuthenticatedCliente();
        CarrinhoCompra carrinho = getCarrinhoAtual(cliente);
        List<ItemCarrinho> itens = carrinho.getItens() == null ? List.of() : carrinho.getItens();
        if (itens.isEmpty()) {
            log.warn("[FRETE] Tentativa de calcular frete com carrinho vazio - Cliente: {}", cliente.getEmail());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Carrinho vazio");
        }

        Endereco endereco = resolveEnderecoEntrega(cliente, asLong(req.get("enderecoId")));
        BigDecimal valorFrete = calcularFreteInterno(endereco, itens);
        
        log.info("[FRETE] Frete calculado - Cliente: {} - CEP: {} - Valor: R${} - Itens: {}", 
                cliente.getEmail(), endereco.getCep(), valorFrete, itens.size());

        Map<String, Object> response = new HashMap<>();
        response.put("valorFrete", valorFrete);
        response.put("enderecoId", endereco.getId());
        response.put("prazoEntregaDias", 7);
        return response;
    }

    public Map<String, Object> validarCupons(Map<String, Object> req) {
        Cliente cliente = getAuthenticatedCliente();
        CarrinhoCompra carrinho = getCarrinhoAtual(cliente);
        List<ItemCarrinho> itens = carrinho.getItens() == null ? List.of() : carrinho.getItens();
        if (itens.isEmpty()) {
            log.warn("[CUPOM] Tentativa de validar cupons com carrinho vazio - Cliente: {}", cliente.getEmail());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Carrinho vazio");
        }

        BigDecimal subtotal = calcularSubtotal(itens);
        Endereco endereco = resolveEnderecoOpcional(cliente, asLong(req.get("enderecoId")));
        BigDecimal frete = calcularFreteInterno(endereco, itens);
        BigDecimal total = subtotal.add(frete);

        DiscountResult desconto = calcularDesconto(cliente, total, req);
        
        log.info("[CUPOM] Cupons validados - Cliente: {} - Desconto total: R${} - Cupons troca: R${} - Cupom promocional: R${}", 
                cliente.getEmail(), desconto.descontoAplicado, desconto.cupomsTrocaValor, desconto.cupomPromocionalValor);

        Map<String, Object> response = new HashMap<>();
        response.put("cupomsTrocaValor", desconto.cupomsTrocaValor);
        response.put("cupomPromocionalValor", desconto.cupomPromocionalValor);
        response.put("desconto", desconto.descontoAplicado);
        response.put("restante", desconto.restante);
        response.put("cuponsTrocaAplicados", desconto.cuponsTrocaAplicados.stream().map(CupomTroca::getId).toList());
        return response;
    }

    public Map<String, Object> finalizarCompra(Map<String, Object> req) {
        Cliente cliente = getAuthenticatedCliente();
        CarrinhoCompra carrinho = getCarrinhoAtual(cliente);

        List<ItemCarrinho> itensCarrinho = carrinho.getItens() == null ? List.of() : carrinho.getItens();
        if (itensCarrinho.isEmpty()) {
            log.warn("[CHECKOUT] Tentativa de finalizar compra com carrinho vazio - Cliente: {}", cliente.getEmail());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Carrinho vazio");
        }

        long ttlMinutos = getCarrinhoTtlMinutos();
        if (reservaExpirada(itensCarrinho, ttlMinutos)) {
            log.warn("[CHECKOUT] Reserva do carrinho expirada - Cliente: {} - TTL: {} minutos", cliente.getEmail(), ttlMinutos);
            liberarEstoqueReservado(itensCarrinho);
            itemCarrinhoRepository.deleteAllByCarrinhoIdQuery(carrinho.getId());
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A reserva do carrinho expirou. Adicione os itens novamente para continuar."
            );
        }

        validarEstoqueParaCompra(itensCarrinho);

        Long enderecoId = asLong(req.get("enderecoEntregaId"));
        if (enderecoId == null) {
            log.warn("[CHECKOUT] Tentativa de finalizar compra sem endereço de entrega - Cliente: {}", cliente.getEmail());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "enderecoEntregaId é obrigatório");
        }
        Endereco endereco = resolveEnderecoEntrega(cliente, enderecoId);

        BigDecimal subtotal = calcularSubtotal(itensCarrinho);
        BigDecimal valorFrete = calcularFreteInterno(endereco, itensCarrinho);
        BigDecimal valorTotal = subtotal.add(valorFrete);
        DiscountResult desconto = calcularDesconto(cliente, valorTotal, req);
        BigDecimal valorAPagar = desconto.restante;

        List<Map<String, Object>> pagamentosReq = asListOfMaps(req.get("formasPagamento"));
        if (valorAPagar.compareTo(BigDecimal.ZERO) > 0 && pagamentosReq.isEmpty()) {
            log.warn("[CHECKOUT] Tentativa de finalizar compra sem forma de pagamento - Cliente: {} - Valor a pagar: R${}", 
                    cliente.getEmail(), valorAPagar);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe ao menos uma forma de pagamento");
        }

        PaymentBuildResult paymentBuild = construirFormasPagamento(cliente, pagamentosReq, valorAPagar);
        if (paymentBuild.somaPagamentos.compareTo(valorAPagar) != 0) {
            log.warn("[CHECKOUT] Soma dos pagamentos incorreta - Cliente: {} - Esperado: R${} - Recebido: R${}", 
                    cliente.getEmail(), valorAPagar, paymentBuild.somaPagamentos);
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A soma dos pagamentos deve ser exatamente " + valorAPagar
            );
        }

        log.info("[CHECKOUT] Iniciando processamento de compra - Cliente: {} - Valor total: R${} - Valor a pagar: R${} - Itens: {}", 
                cliente.getEmail(), valorTotal, valorAPagar, itensCarrinho.size());

        Pedido pedido = criarPedidoEmProcessamento(
                cliente,
                endereco,
                itensCarrinho,
                paymentBuild.formasPagamento,
                valorFrete,
                valorTotal
        );

        if (!paymentBuild.errosPagamento.isEmpty()) {
            log.error("[PAGAMENTO] Pagamento recusado - Cliente: {} - PedidoID: {} - Erros: {}", 
                    cliente.getEmail(), pedido.getId(), paymentBuild.errosPagamento.size());
            StatusPedido statusAnterior = pedido.getStatus();
            pedido.setStatus(StatusPedido.REPROVADA);
            Pedido reprovado = pedidoRepository.save(pedido);
            transacaoLogService.registrar(
                    "PEDIDO",
                    reprovado.getId(),
                    OperacaoLog.UPDATE,
                    statusSnapshot(statusAnterior),
                    statusSnapshot(reprovado.getStatus())
            );

            liberarEstoqueReservado(itensCarrinho);
            itemCarrinhoRepository.deleteAllByCarrinhoIdQuery(carrinho.getId());

            throw new PaymentRejectedException(
                    "Pagamento recusado pela operadora",
                    paymentBuild.errosPagamento,
                    reprovado.getId()
            );
        }

        log.info("[PAGAMENTO] Pagamento aprovado - Cliente: {} - PedidoID: {}", cliente.getEmail(), pedido.getId());
        
        atualizarEstoquePosCompra(itensCarrinho);

        StatusPedido statusAnterior = pedido.getStatus();
        pedido.setStatus(StatusPedido.APROVADA);
        Pedido aprovado = pedidoRepository.save(pedido);
        transacaoLogService.registrar(
                "PEDIDO",
                aprovado.getId(),
                OperacaoLog.UPDATE,
                statusSnapshot(statusAnterior),
                statusSnapshot(aprovado.getStatus())
        );

        if (!desconto.cuponsTrocaAplicados.isEmpty()) {
            log.info("[CUPOM] Marcando {} cupons de troca como utilizados - Cliente: {} - PedidoID: {}", 
                    desconto.cuponsTrocaAplicados.size(), cliente.getEmail(), aprovado.getId());
            desconto.cuponsTrocaAplicados.forEach(cupom -> cupom.setUtilizado(true));
            cupomTrocaRepository.saveAll(desconto.cuponsTrocaAplicados);
        }

        if (desconto.excedenteCupom.compareTo(BigDecimal.ZERO) > 0) {
            log.info("[CUPOM] Gerando cupom de troca por excedente - Cliente: {} - Valor: R${} - PedidoID: {}", 
                    cliente.getEmail(), desconto.excedenteCupom, aprovado.getId());
            CupomTroca novoCupom = new CupomTroca();
            novoCupom.setCliente(cliente);
            novoCupom.setPedidoOrigem(aprovado);
            novoCupom.setUtilizado(false);
            novoCupom.setValor(desconto.excedenteCupom);
            novoCupom.setDataGeracao(LocalDateTime.now());
            CupomTroca savedCupom = cupomTrocaRepository.save(novoCupom);
            transacaoLogService.registrar(
                    "CUPOM_TROCA",
                    savedCupom.getId(),
                    OperacaoLog.INSERT,
                    null,
                    Map.of(
                            "clienteId", cliente.getId(),
                            "pedidoOrigemId", aprovado.getId(),
                            "valor", savedCupom.getValor()
                    )
            );
        }

        Map<String, Object> clienteAntes = clienteSnapshot(cliente);
        if (cliente.getRanking() == null) {
            cliente.setRanking(BigDecimal.ZERO);
        }
        cliente.setRanking(cliente.getRanking().add(valorTotal));
        Cliente clienteAtualizado = clienteRepository.save(cliente);
        transacaoLogService.registrar(
                "CLIENTE",
                clienteAtualizado.getId(),
                OperacaoLog.UPDATE,
                clienteAntes,
                clienteSnapshot(clienteAtualizado)
        );

        itemCarrinhoRepository.deleteAllByCarrinhoIdQuery(carrinho.getId());

        notificacaoService.criar(
                cliente,
                "Pedido aprovado",
                "Seu pedido PED-" + aprovado.getId() + " foi aprovado e está sendo processado.",
                "/account/orders",
                "PEDIDO_APROVADO"
        );

        log.info("[CHECKOUT] Pedido finalizado com sucesso - PedidoID: {} - Cliente: {} - Valor total: R${} - Valor pago: R${} - Frete: R${}", 
                aprovado.getId(), cliente.getEmail(), valorTotal, valorAPagar, valorFrete);

        Map<String, Object> response = new HashMap<>();
        response.put("pedidoId", aprovado.getId());
        response.put("numero", "PED-" + String.format("%03d", aprovado.getId()));
        response.put("statusInicial", StatusPedido.EM_PROCESSAMENTO.name());
        response.put("status", aprovado.getStatus() != null ? aprovado.getStatus().name() : null);
        response.put("valorTotal", aprovado.getValorTotal());
        response.put("dataCompra", aprovado.getDataPedido());
        response.put("dataEntregaPrevista", LocalDate.now().plusDays(7));
        return response;
    }

    private Pedido criarPedidoEmProcessamento(
            Cliente cliente,
            Endereco endereco,
            List<ItemCarrinho> itensCarrinho,
            List<FormaPagamento> formasPagamento,
            BigDecimal valorFrete,
            BigDecimal valorTotal
    ) {
        Pedido pedido = new Pedido();
        pedido.setCliente(cliente);
        pedido.setEnderecoEntrega(formatEndereco(endereco));
        pedido.setStatus(StatusPedido.EM_PROCESSAMENTO);
        pedido.setValorFrete(valorFrete);
        pedido.setValorTotal(valorTotal);
        pedido.setDataPedido(LocalDateTime.now());

        List<ItemPedido> itensPedido = new ArrayList<>();
        for (ItemCarrinho itemCarrinho : itensCarrinho) {
            ItemPedido itemPedido = new ItemPedido();
            itemPedido.setPedido(pedido);
            itemPedido.setLivro(itemCarrinho.getLivro());
            itemPedido.setQuantidade(itemCarrinho.getQuantidade());
            BigDecimal valorUnitario = itemCarrinho.getLivro() != null && itemCarrinho.getLivro().getValorVenda() != null
                    ? itemCarrinho.getLivro().getValorVenda()
                    : BigDecimal.ZERO;
            itemPedido.setValorUnitario(valorUnitario);
            itensPedido.add(itemPedido);
        }
        pedido.setItens(itensPedido);

        formasPagamento.forEach(fp -> fp.setPedido(pedido));
        pedido.setFormasPagamento(formasPagamento);

        Pedido saved = pedidoRepository.save(pedido);
        transacaoLogService.registrar("PEDIDO", saved.getId(), OperacaoLog.INSERT, null, pedidoSnapshot(saved));
        return saved;
    }

    private PaymentBuildResult construirFormasPagamento(
            Cliente cliente,
            List<Map<String, Object>> pagamentosReq,
            BigDecimal valorAPagar
    ) {
        List<FormaPagamento> formasPagamento = new ArrayList<>();
        List<Map<String, Object>> errosPagamento = new ArrayList<>();
        BigDecimal somaPagamentos = BigDecimal.ZERO;

        for (Map<String, Object> pagamentoReq : pagamentosReq) {
            FormaPagamento fp = new FormaPagamento();
            fp.setTipo(parseTipoPagamento(asString(pagamentoReq.get("tipo"))));
            BigDecimal valor = asBigDecimal(pagamentoReq.get("valor"));
            if (valor == null || valor.compareTo(BigDecimal.ZERO) <= 0) {
                log.warn("[PAGAMENTO] Valor de pagamento inválido - Valor: {}", valor);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valor de pagamento inválido");
            }
            if (fp.getTipo() == TipoPagamento.CARTAO_CREDITO
                    && valor.compareTo(MINIMO_CARTAO) < 0
                    && valorAPagar.compareTo(MINIMO_CARTAO) >= 0) {
                log.warn("[PAGAMENTO] Valor do cartão abaixo do mínimo - Valor: R${} - Mínimo: R${}", valor, MINIMO_CARTAO);
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Cada cartão deve pagar no mínimo R$ 10,00"
                );
            }

            fp.setValor(valor);
            somaPagamentos = somaPagamentos.add(valor);

            Long cartaoId = asLong(pagamentoReq.get("cartaoId"));
            if (cartaoId != null) {
                CartaoCredito cartao = cartaoRepository.findByIdAndClienteId(cartaoId, cliente.getId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cartão inválido"));
                fp.setCartaoCredito(cartao);
                if (isCartaoPar(cartao.getNumero())) {
                    log.warn("[PAGAMENTO] Cartão recusado (dígito par) - Últimos dígitos: {}", getUltimosDigitos(cartao.getNumero()));
                    Map<String, Object> erro = new HashMap<>();
                    erro.put("cartaoUltimosDigitos", getUltimosDigitos(cartao.getNumero()));
                    erro.put("motivo", "CardBlocked");
                    errosPagamento.add(erro);
                } else {
                    log.info("[PAGAMENTO] Cartão aprovado - Últimos dígitos: {} - Valor: R${}", 
                            getUltimosDigitos(cartao.getNumero()), valor);
                }
            }
            formasPagamento.add(fp);
        }

        return new PaymentBuildResult(formasPagamento, errosPagamento, somaPagamentos);
    }

    private DiscountResult calcularDesconto(Cliente cliente, BigDecimal totalCompra, Map<String, Object> req) {
        List<Long> cupomIds = asListOfLong(req.get("cupomsTroca"));
        String cupomPromocionalCodigo = asString(req.get("cupomPromocional"));

        List<CupomTroca> cuponsTrocaSelecionados = cupomIds.isEmpty()
                ? List.of()
                : cupomTrocaRepository.findByIdInAndClienteIdAndUtilizadoFalse(cupomIds, cliente.getId());
        if (cuponsTrocaSelecionados.size() != cupomIds.size()) {
            log.warn("[CUPOM] Cupom de troca inválido ou já utilizado - Cliente: {} - Cupons solicitados: {} - Cupons válidos: {}", 
                    cliente.getEmail(), cupomIds.size(), cuponsTrocaSelecionados.size());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cupom de troca inválido");
        }

        BigDecimal valorPromocional = BigDecimal.ZERO;
        if (cupomPromocionalCodigo != null && !cupomPromocionalCodigo.isBlank()) {
            CupomPromocional cupomPromocional = cupomPromocionalRepository.findByCodigoIgnoreCase(cupomPromocionalCodigo.trim())
                    .orElseThrow(() -> {
                        log.warn("[CUPOM] Cupom promocional não encontrado - Código: {}", cupomPromocionalCodigo);
                        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cupom promocional inválido");
                    });
            if (!Boolean.TRUE.equals(cupomPromocional.getValido())) {
                log.warn("[CUPOM] Cupom promocional inválido - Código: {} - Válido: {}", cupomPromocionalCodigo, cupomPromocional.getValido());
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cupom promocional inválido");
            }
            if (cupomPromocional.getDataValidade() != null && cupomPromocional.getDataValidade().isBefore(LocalDate.now())) {
                log.warn("[CUPOM] Cupom promocional expirado - Código: {} - Data validade: {}", 
                        cupomPromocionalCodigo, cupomPromocional.getDataValidade());
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cupom promocional expirado");
            }
            valorPromocional = nullSafe(cupomPromocional.getValor());
            log.info("[CUPOM] Cupom promocional aplicado - Código: {} - Valor: R${}", cupomPromocionalCodigo, valorPromocional);
        }

        BigDecimal restanteAposPromocional = totalCompra.subtract(valorPromocional).max(BigDecimal.ZERO);
        List<CupomTroca> cuponsTrocaAplicados = selecionarCuponsTrocaMinimos(cuponsTrocaSelecionados, restanteAposPromocional);
        BigDecimal valorTrocas = cuponsTrocaAplicados.stream()
                .map(cupom -> nullSafe(cupom.getValor()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal descontoBruto = valorTrocas.add(valorPromocional);
        BigDecimal descontoAplicado = descontoBruto.min(totalCompra);
        BigDecimal restante = totalCompra.subtract(descontoAplicado);
        BigDecimal excedente = descontoBruto.subtract(descontoAplicado).max(BigDecimal.ZERO);

        return new DiscountResult(
                valorTrocas,
                valorPromocional,
                descontoAplicado,
                restante,
                excedente,
                cuponsTrocaAplicados
        );
    }

    private List<CupomTroca> selecionarCuponsTrocaMinimos(List<CupomTroca> selecionados, BigDecimal alvo) {
        if (selecionados == null || selecionados.isEmpty()) {
            return List.of();
        }
        if (alvo.compareTo(BigDecimal.ZERO) <= 0) {
            return List.of();
        }

        List<CupomTroca> ordenados = new ArrayList<>(selecionados);
        ordenados.sort(Comparator.comparing((CupomTroca c) -> nullSafe(c.getValor())).reversed());

        BigDecimal acumulado = BigDecimal.ZERO;
        List<CupomTroca> aplicados = new ArrayList<>();
        for (CupomTroca cupom : ordenados) {
            if (acumulado.compareTo(alvo) >= 0) {
                break;
            }
            aplicados.add(cupom);
            acumulado = acumulado.add(nullSafe(cupom.getValor()));
        }

        return aplicados;
    }

    private void validarEstoqueParaCompra(List<ItemCarrinho> itensCarrinho) {
        for (ItemCarrinho item : itensCarrinho) {
            if (item.getLivro() == null || item.getLivro().getId() == null) {
                log.warn("[CHECKOUT] Item inválido no carrinho - ItemID: {}", item.getId());
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Item inválido no carrinho");
            }
            Estoque estoque = estoqueRepository.findByLivroId(item.getLivro().getId())
                    .orElseThrow(() -> {
                        log.warn("[CHECKOUT] Livro sem estoque cadastrado - LivroID: {} - Título: {}", 
                                item.getLivro().getId(), item.getLivro().getTitulo());
                        return new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Livro sem estoque: " + item.getLivro().getTitulo()
                        );
                    });
            int quantidade = safeInt(item.getQuantidade());
            int total = safeInt(estoque.getQuantidadeTotal());
            int bloqueado = safeInt(estoque.getQuantidadeBloqueada());

            if (quantidade <= 0 || quantidade > total || quantidade > bloqueado) {
                log.warn("[CHECKOUT] Estoque insuficiente - LivroID: {} - Título: {} - Solicitado: {} - Total: {} - Bloqueado: {}", 
                        item.getLivro().getId(), item.getLivro().getTitulo(), quantidade, total, bloqueado);
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Estoque insuficiente para o livro: " + item.getLivro().getTitulo()
                );
            }
        }
        log.info("[CHECKOUT] Validação de estoque concluída - Itens validados: {}", itensCarrinho.size());
    }

    private void atualizarEstoquePosCompra(List<ItemCarrinho> itensCarrinho) {
        for (ItemCarrinho item : itensCarrinho) {
            Estoque estoque = estoqueRepository.findByLivroId(item.getLivro().getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Livro sem estoque"));

            int quantidade = safeInt(item.getQuantidade());
            int total = safeInt(estoque.getQuantidadeTotal());
            int bloqueada = safeInt(estoque.getQuantidadeBloqueada());

            int novoTotal = Math.max(0, total - quantidade);
            int novaBloqueada = Math.max(0, bloqueada - quantidade);
            int novoDisponivel = Math.max(0, novoTotal - novaBloqueada);

            estoque.setQuantidadeTotal(novoTotal);
            estoque.setQuantidadeBloqueada(novaBloqueada);
            estoque.setQuantidadeDisponivel(novoDisponivel);
            estoqueRepository.save(estoque);
        }
    }

    private void liberarEstoqueReservado(List<ItemCarrinho> itensCarrinho) {
        for (ItemCarrinho item : itensCarrinho) {
            if (item.getLivro() == null || item.getLivro().getId() == null) continue;
            Estoque estoque = estoqueRepository.findByLivroId(item.getLivro().getId()).orElse(null);
            if (estoque == null) continue;

            int quantidade = safeInt(item.getQuantidade());
            int total = safeInt(estoque.getQuantidadeTotal());
            int bloqueada = safeInt(estoque.getQuantidadeBloqueada());

            int novaBloqueada = Math.max(0, bloqueada - quantidade);
            int novoDisponivel = Math.max(0, total - novaBloqueada);

            estoque.setQuantidadeBloqueada(novaBloqueada);
            estoque.setQuantidadeDisponivel(novoDisponivel);
            estoqueRepository.save(estoque);
        }
    }

    private boolean reservaExpirada(List<ItemCarrinho> itens, long ttlMinutos) {
        LocalDateTime ultimoBloqueio = itens.stream()
                .map(ItemCarrinho::getBloqueadoEm)
                .filter(data -> data != null)
                .max(LocalDateTime::compareTo)
                .orElse(null);
        if (ultimoBloqueio == null) return false;
        return LocalDateTime.now().isAfter(ultimoBloqueio.plusMinutes(ttlMinutos));
    }

    private long getCarrinhoTtlMinutos() {
        long ttl = parametroSistemaService.getLong(PARAM_CART_TTL_MINUTOS, 30L);
        return ttl <= 0 ? 30L : ttl;
    }

    private BigDecimal calcularFreteInterno(Endereco endereco, List<ItemCarrinho> itens) {
        if (itens == null || itens.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal base = parametroSistemaService.getBigDecimal(PARAM_FRETE_BASE, BigDecimal.TEN);
        BigDecimal porItem = parametroSistemaService.getBigDecimal(PARAM_FRETE_POR_ITEM, BigDecimal.ONE);
        int quantidadeItens = itens.stream().map(ItemCarrinho::getQuantidade).filter(q -> q != null && q > 0).reduce(0, Integer::sum);

        BigDecimal adicionalEstado = calcularAdicionalPorEstado(endereco != null ? endereco.getEstado() : null);
        return base
                .add(porItem.multiply(BigDecimal.valueOf(quantidadeItens)))
                .add(adicionalEstado)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calcularAdicionalPorEstado(String estado) {
        if (estado == null || estado.isBlank()) return BigDecimal.valueOf(5);
        String uf = estado.trim().toUpperCase();
        if (List.of("SP", "RJ", "MG", "ES").contains(uf)) return BigDecimal.ZERO;
        if (List.of("PR", "SC", "RS").contains(uf)) return BigDecimal.valueOf(2);
        return BigDecimal.valueOf(5);
    }

    private Endereco resolveEnderecoEntrega(Cliente cliente, Long enderecoId) {
        if (enderecoId == null) {
            log.warn("[CHECKOUT] Endereço de entrega não informado - Cliente: {}", cliente.getEmail());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Endereço de entrega é obrigatório");
        }
        return enderecoRepository.findByIdAndClienteId(enderecoId, cliente.getId())
                .orElseThrow(() -> {
                    log.warn("[CHECKOUT] Endereço de entrega inválido - Cliente: {} - EndereçoID: {}", cliente.getEmail(), enderecoId);
                    return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Endereço de entrega inválido");
                });
    }

    private Endereco resolveEnderecoOpcional(Cliente cliente, Long enderecoId) {
        if (enderecoId == null) return null;
        return enderecoRepository.findByIdAndClienteId(enderecoId, cliente.getId()).orElse(null);
    }

    private CarrinhoCompra getCarrinhoAtual(Cliente cliente) {
        return carrinhoRepository.findByClienteId(cliente.getId())
                .orElseThrow(() -> {
                    log.warn("[CHECKOUT] Carrinho não encontrado - Cliente: {}", cliente.getEmail());
                    return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Carrinho não encontrado");
                });
    }

    private Cliente getAuthenticatedCliente() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            log.warn("[CHECKOUT] Tentativa de acesso sem autenticação");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado");
        }
        return clienteRepository.findFirstByEmailIgnoreCaseOrderByIdAsc(authentication.getName())
                .orElseThrow(() -> {
                    log.error("[CHECKOUT] Cliente autenticado não encontrado no banco - Email: {}", authentication.getName());
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cliente não encontrado");
                });
    }

    private BigDecimal calcularSubtotal(List<ItemCarrinho> itens) {
        if (itens == null || itens.isEmpty()) return BigDecimal.ZERO;
        BigDecimal subtotal = BigDecimal.ZERO;
        for (ItemCarrinho item : itens) {
            BigDecimal valorUnitario = item.getLivro() != null && item.getLivro().getValorVenda() != null
                    ? item.getLivro().getValorVenda()
                    : BigDecimal.ZERO;
            subtotal = subtotal.add(valorUnitario.multiply(BigDecimal.valueOf(safeInt(item.getQuantidade()))));
        }
        return subtotal;
    }

    private TipoPagamento parseTipoPagamento(String raw) {
        if (raw == null || raw.isBlank()) return TipoPagamento.CARTAO_CREDITO;
        try {
            return TipoPagamento.valueOf(raw);
        } catch (IllegalArgumentException ex) {
            log.warn("[PAGAMENTO] Tipo de pagamento inválido - Valor recebido: {}", raw);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de pagamento inválido");
        }
    }

    private boolean isCartaoPar(String numero) {
        if (numero == null || numero.isBlank()) return false;
        String digits = numero.replaceAll("\\D", "");
        if (digits.isEmpty()) return false;
        int last = Character.getNumericValue(digits.charAt(digits.length() - 1));
        return last % 2 == 0;
    }

    private String getUltimosDigitos(String numero) {
        if (numero == null) return "";
        String digits = numero.replaceAll("\\D", "");
        if (digits.length() <= 4) return digits;
        return digits.substring(digits.length() - 4);
    }

    private String formatEndereco(Endereco endereco) {
        StringBuilder sb = new StringBuilder();
        appendIfPresent(sb, endereco.getLogradouro());
        appendIfPresent(sb, endereco.getNumero());
        appendIfPresent(sb, endereco.getBairro());
        appendIfPresent(sb, endereco.getCidade());
        appendIfPresent(sb, endereco.getEstado());
        appendIfPresent(sb, endereco.getPais());
        return sb.toString();
    }

    private void appendIfPresent(StringBuilder sb, String value) {
        if (value == null || value.isBlank()) return;
        if (!sb.isEmpty()) sb.append(", ");
        sb.append(value.trim());
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> asListOfMaps(Object value) {
        if (!(value instanceof List<?> list)) return List.of();
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Map<?, ?> rawMap) {
                Map<String, Object> casted = new HashMap<>();
                rawMap.forEach((k, v) -> casted.put(String.valueOf(k), v));
                out.add(casted);
            }
        }
        return out;
    }

    private List<Long> asListOfLong(Object value) {
        if (!(value instanceof List<?> list)) return List.of();
        List<Long> ids = new ArrayList<>();
        for (Object item : list) {
            Long id = asLong(item);
            if (id != null) ids.add(id);
        }
        return ids;
    }

    private String asString(Object value) {
        if (value == null) return null;
        return String.valueOf(value).trim();
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

    private BigDecimal asBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
        String raw = String.valueOf(value).trim();
        if (raw.isEmpty()) return null;
        try {
            return new BigDecimal(raw);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private BigDecimal nullSafe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private Map<String, Object> pedidoSnapshot(Pedido pedido) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("id", pedido.getId());
        snapshot.put("clienteId", pedido.getCliente() != null ? pedido.getCliente().getId() : null);
        snapshot.put("status", pedido.getStatus() != null ? pedido.getStatus().name() : null);
        snapshot.put("valorFrete", pedido.getValorFrete());
        snapshot.put("valorTotal", pedido.getValorTotal());
        snapshot.put("dataPedido", pedido.getDataPedido());
        return snapshot;
    }

    private Map<String, Object> statusSnapshot(StatusPedido status) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("status", status != null ? status.name() : null);
        return snapshot;
    }

    private Map<String, Object> clienteSnapshot(Cliente cliente) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("id", cliente.getId());
        snapshot.put("ranking", cliente.getRanking());
        return snapshot;
    }

    private record DiscountResult(
            BigDecimal cupomsTrocaValor,
            BigDecimal cupomPromocionalValor,
            BigDecimal descontoAplicado,
            BigDecimal restante,
            BigDecimal excedenteCupom,
            List<CupomTroca> cuponsTrocaAplicados
    ) {
    }

    private record PaymentBuildResult(
            List<FormaPagamento> formasPagamento,
            List<Map<String, Object>> errosPagamento,
            BigDecimal somaPagamentos
    ) {
    }

    public static class PaymentRejectedException extends RuntimeException {
        private final List<Map<String, Object>> errors;
        private final Long pedidoId;

        public PaymentRejectedException(String message, List<Map<String, Object>> errors, Long pedidoId) {
            super(message);
            this.errors = errors;
            this.pedidoId = pedidoId;
        }

        public List<Map<String, Object>> getErrors() {
            return errors;
        }

        public Long getPedidoId() {
            return pedidoId;
        }
    }
}
