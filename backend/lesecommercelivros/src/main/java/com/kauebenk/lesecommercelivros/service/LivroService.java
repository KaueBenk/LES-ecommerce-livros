package com.kauebenk.lesecommercelivros.service;

import com.kauebenk.lesecommercelivros.dto.PaginatedResponse;
import com.kauebenk.lesecommercelivros.entity.Avaliacao;
import com.kauebenk.lesecommercelivros.entity.Cliente;
import com.kauebenk.lesecommercelivros.entity.Livro;
import com.kauebenk.lesecommercelivros.repository.AvaliacaoRepository;
import com.kauebenk.lesecommercelivros.repository.ClienteRepository;
import com.kauebenk.lesecommercelivros.repository.LivroRepository;
import com.kauebenk.lesecommercelivros.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@Transactional
public class LivroService {

    @Autowired
    private LivroRepository livroRepository;

    @Autowired
    private AvaliacaoRepository avaliacaoRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private NotificacaoService notificacaoService;

    @Transactional(readOnly = true)
    public PaginatedResponse<Livro> getAllLivros(
            Pageable pageable,
            String titulo,
            Long autorId,
            Long categoriaId,
            Integer ano,
            String isbn,
            Boolean ativo
    ) {
        Page<Livro> page = livroRepository.search(
                normalizeString(titulo),
                autorId,
                categoriaId,
                ano,
                normalizeString(isbn),
                ativo,
                pageable
        );
        return new PaginatedResponse<>(page);
    }

    @Transactional(readOnly = true)
    public Livro getLivroById(Long id) {
        return livroRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Livro não encontrado"));
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<Map<String, Object>> getAvaliacoesLivro(Long livroId, Boolean aprovada, Pageable pageable) {
        if (!livroRepository.existsById(livroId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Livro não encontrado");
        }
        Page<Avaliacao> page = aprovada == null
                ? avaliacaoRepository.findByLivroId(livroId, pageable)
                : avaliacaoRepository.findByLivroIdAndAprovada(livroId, aprovada, pageable);
        Page<Map<String, Object>> mapped = page.map(this::toAvaliacaoResponse);
        return new PaginatedResponse<>(mapped);
    }

    public Map<String, Object> criarAvaliacao(Long livroId, Map<String, Object> payload) {
        Livro livro = livroRepository.findById(livroId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Livro não encontrado"));
        Cliente cliente = getAuthenticatedCliente();

        if (!pedidoRepository.hasDeliveredPurchaseForBook(cliente.getId(), livroId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Você precisa ter comprado este livro para avaliá-lo"
            );
        }

        Integer estrelas = asInteger(payload.get("estrelas"));
        String texto = normalizeString(payload.get("texto"));

        if (estrelas == null || estrelas < 1 || estrelas > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A nota deve estar entre 1 e 5");
        }
        if (texto == null || texto.length() < 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A avaliação deve ter pelo menos 10 caracteres");
        }

        Avaliacao avaliacao = new Avaliacao();
        avaliacao.setLivro(livro);
        avaliacao.setCliente(cliente);
        avaliacao.setEstrelas(estrelas);
        avaliacao.setTexto(texto);
        avaliacao.setAprovada(false);
        avaliacao.setDataAvaliacao(LocalDateTime.now());
        avaliacao = avaliacaoRepository.save(avaliacao);

        notificacaoService.criar(
                cliente,
                "Avaliação enviada",
                "Sua avaliação para o livro \"" + livro.getTitulo() + "\" foi enviada para moderação.",
                "/product/" + livro.getId(),
                "AVALIACAO_ENVIADA"
        );

        Map<String, Object> response = new HashMap<>();
        response.put("id", avaliacao.getId());
        response.put("success", true);
        return response;
    }

    private Map<String, Object> toAvaliacaoResponse(Avaliacao avaliacao) {
        Map<String, Object> clienteData = new HashMap<>();
        if (avaliacao.getCliente() != null) {
            clienteData.put("id", avaliacao.getCliente().getId());
            clienteData.put("nome", avaliacao.getCliente().getNome());
        }

        Map<String, Object> map = new HashMap<>();
        map.put("id", avaliacao.getId());
        map.put("cliente", clienteData);
        map.put("estrelas", avaliacao.getEstrelas());
        map.put("texto", avaliacao.getTexto());
        map.put("dataAvaliacao", avaliacao.getDataAvaliacao());
        map.put("aprovada", avaliacao.getAprovada());
        return map;
    }

    private Cliente getAuthenticatedCliente() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado");
        }
        return clienteRepository.findFirstByEmailIgnoreCaseOrderByIdAsc(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cliente não encontrado"));
    }

    private String normalizeString(Object value) {
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    private Integer asInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.intValue();
        try {
            return Integer.parseInt(String.valueOf(value).trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
