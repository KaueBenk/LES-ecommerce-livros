package com.kauebenk.lesecommercelivros.service;

import com.kauebenk.lesecommercelivros.entity.Cliente;
import com.kauebenk.lesecommercelivros.entity.ItemPedido;
import com.kauebenk.lesecommercelivros.entity.ItemTroca;
import com.kauebenk.lesecommercelivros.entity.Pedido;
import com.kauebenk.lesecommercelivros.entity.SolicitacaoTroca;
import com.kauebenk.lesecommercelivros.entity.enums.StatusPedido;
import com.kauebenk.lesecommercelivros.entity.enums.StatusTroca;
import com.kauebenk.lesecommercelivros.repository.ClienteRepository;
import com.kauebenk.lesecommercelivros.repository.ItemPedidoRepository;
import com.kauebenk.lesecommercelivros.repository.PedidoRepository;
import com.kauebenk.lesecommercelivros.repository.SolicitacaoTrocaRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@Transactional
public class PedidoService {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private ItemPedidoRepository itemPedidoRepository;

    @Autowired
    private SolicitacaoTrocaRepository solicitacaoTrocaRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private NotificacaoService notificacaoService;

    public Map<String, Object> solicitarTroca(Long pedidoId, Map<String, Object> payload) {
        Cliente cliente = getAuthenticatedCliente();
        Pedido pedido = pedidoRepository.findByIdAndClienteId(pedidoId, cliente.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido não encontrado"));

        if (pedido.getStatus() != StatusPedido.ENTREGUE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Somente pedidos com status ENTREGUE podem solicitar troca"
            );
        }

        List<Map<String, Object>> itensPayload = asListOfMaps(payload.get("itens"));
        if (itensPayload.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione ao menos um item para troca");
        }

        List<ItemTroca> itensTroca = new ArrayList<>();
        for (Map<String, Object> itemPayload : itensPayload) {
            Long itemPedidoId = asLong(itemPayload.get("itemPedidoId"));
            Integer quantidade = asInteger(itemPayload.get("quantidade"));
            String justificativa = asString(itemPayload.get("justificativa"));

            if (itemPedidoId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "itemPedidoId é obrigatório");
            }
            if (quantidade == null || quantidade <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantidade de troca inválida");
            }
            if (justificativa == null || justificativa.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Justificativa é obrigatória");
            }

            ItemPedido itemPedido = itemPedidoRepository.findByIdAndPedidoId(itemPedidoId, pedido.getId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Item do pedido inválido para troca"
                    ));

            if (quantidade > itemPedido.getQuantidade()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantidade solicitada excede o pedido");
            }

            ItemTroca itemTroca = new ItemTroca();
            itemTroca.setItemPedido(itemPedido);
            itemTroca.setQuantidade(quantidade);
            itemTroca.setJustificativa(justificativa.trim());
            itemTroca.setRetornarAoEstoque(null);
            itensTroca.add(itemTroca);
        }

        SolicitacaoTroca troca = new SolicitacaoTroca();
        troca.setPedido(pedido);
        troca.setItensDevolvidos(itensTroca);
        troca.setStatus(StatusTroca.EM_TROCA);
        troca.setDataSolicitacao(LocalDateTime.now());
        
        log.info("[TROCA] Iniciando criação de solicitação de troca - PedidoID: {} - Cliente: {} - TotalItens: {}", 
                pedido.getId(), cliente.getEmail(), itensTroca.size());
        troca = solicitacaoTrocaRepository.save(troca);
        log.info("[TROCA] Solicitação de troca criada com sucesso - TrocaID: {} - PedidoID: {}", 
                troca.getId(), pedido.getId());

        log.info("[PEDIDO] Atualizando status do pedido para EM_TROCA - PedidoID: {}", pedido.getId());
        pedido.setStatus(StatusPedido.EM_TROCA);
        pedidoRepository.save(pedido);
        log.info("[PEDIDO] Status do pedido atualizado - PedidoID: {} - NovoStatus: {}", 
                pedido.getId(), StatusPedido.EM_TROCA);

        notificacaoService.criar(
                cliente,
                "Solicitação de troca recebida",
                "Recebemos sua solicitação de troca do pedido PED-" + pedido.getId(),
                "/account/orders",
                "TROCA_SOLICITADA"
        );

        Map<String, Object> response = new HashMap<>();
        response.put("id", troca.getId());
        response.put("status", troca.getStatus().name());
        response.put("dataSolicitacao", troca.getDataSolicitacao());
        return response;
    }

    private Cliente getAuthenticatedCliente() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado");
        }
        return clienteRepository.findFirstByEmailIgnoreCaseOrderByIdAsc(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cliente não encontrado"));
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

    private Integer asInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.intValue();
        String raw = String.valueOf(value).trim();
        if (raw.isEmpty()) return null;
        try {
            return Integer.parseInt(raw);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value).trim();
    }
}
