package com.kauebenk.lesecommercelivros.service;

import com.kauebenk.lesecommercelivros.dto.PaginatedResponse;
import com.kauebenk.lesecommercelivros.entity.Avaliacao;
import com.kauebenk.lesecommercelivros.entity.Cliente;
import com.kauebenk.lesecommercelivros.entity.Livro;
import com.kauebenk.lesecommercelivros.repository.AvaliacaoRepository;
import com.kauebenk.lesecommercelivros.repository.ClienteRepository;
import com.kauebenk.lesecommercelivros.repository.LivroRepository;
import com.kauebenk.lesecommercelivros.repository.PedidoRepository;
import lombok.extern.slf4j.Slf4j;
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

@Slf4j
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
        try {
            log.info("[LIVRO] Buscando livros - Titulo: {}, AutorID: {}, CategoriaID: {}, Ativo: {}", 
                    titulo, autorId, categoriaId, ativo);
            Page<Livro> page = livroRepository.search(
                    normalizeString(titulo),
                    autorId,
                    categoriaId,
                    ano,
                    normalizeString(isbn),
                    ativo,
                    pageable
            );
            log.debug("[LIVRO] Livros encontrados: {}", page.getTotalElements());
            return new PaginatedResponse<>(page);
        } catch (Exception e) {
            log.error("[LIVRO] Erro ao buscar livros", e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public Livro getLivroById(Long id) {
        try {
            log.info("[LIVRO] Buscando livro por ID - LivroID: {}", id);
            return livroRepository.findById(id)
                    .orElseThrow(() -> {
                        log.warn("[LIVRO] Livro não encontrado - LivroID: {}", id);
                        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Livro não encontrado");
                    });
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("[LIVRO] Erro ao buscar livro - LivroID: {}", id, e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<Map<String, Object>> getAvaliacoesLivro(Long livroId, Boolean aprovada, Pageable pageable) {
        try {
            if (!livroRepository.existsById(livroId)) {
                log.warn("[LIVRO] Livro não encontrado para busca de avaliações - LivroID: {}", livroId);
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Livro não encontrado");
            }
            log.info("[LIVRO] Buscando avaliações - LivroID: {}, Aprovada: {}", livroId, aprovada);
            Page<Avaliacao> page = aprovada == null
                    ? avaliacaoRepository.findByLivroId(livroId, pageable)
                    : avaliacaoRepository.findByLivroIdAndAprovada(livroId, aprovada, pageable);
            Page<Map<String, Object>> mapped = page.map(this::toAvaliacaoResponse);
            log.debug("[LIVRO] Avaliações encontradas: {}", mapped.getTotalElements());
            return new PaginatedResponse<>(mapped);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("[LIVRO] Erro ao buscar avaliações - LivroID: {}", livroId, e);
            throw e;
        }
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
        
        log.info("[AVALIACAO] Iniciando criação de avaliação - LivroID: {} - Cliente: {} - Estrelas: {}", 
                livro.getId(), cliente.getEmail(), estrelas);
        avaliacao = avaliacaoRepository.save(avaliacao);
        log.info("[AVALIACAO] Avaliação criada com sucesso - AvaliacaoID: {} - LivroID: {} - Cliente: {}", 
                avaliacao.getId(), livro.getId(), cliente.getEmail());

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
