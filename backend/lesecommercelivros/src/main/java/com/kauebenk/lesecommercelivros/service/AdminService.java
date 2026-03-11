package com.kauebenk.lesecommercelivros.service;

import com.kauebenk.lesecommercelivros.dto.PaginatedResponse;
import com.kauebenk.lesecommercelivros.entity.Autor;
import com.kauebenk.lesecommercelivros.entity.Categoria;
import com.kauebenk.lesecommercelivros.entity.CategoriaAtivacao;
import com.kauebenk.lesecommercelivros.entity.CategoriaInativacao;
import com.kauebenk.lesecommercelivros.entity.Editora;
import com.kauebenk.lesecommercelivros.entity.EntradaEstoque;
import com.kauebenk.lesecommercelivros.entity.Estoque;
import com.kauebenk.lesecommercelivros.entity.Fornecedor;
import com.kauebenk.lesecommercelivros.entity.GrupoPrecificacao;
import com.kauebenk.lesecommercelivros.entity.Livro;
import com.kauebenk.lesecommercelivros.entity.enums.OperacaoLog;
import com.kauebenk.lesecommercelivros.entity.enums.StatusPedido;
import com.kauebenk.lesecommercelivros.repository.AutorRepository;
import com.kauebenk.lesecommercelivros.repository.CategoriaAtivacaoRepository;
import com.kauebenk.lesecommercelivros.repository.CategoriaInativacaoRepository;
import com.kauebenk.lesecommercelivros.repository.CategoriaRepository;
import com.kauebenk.lesecommercelivros.repository.EditoraRepository;
import com.kauebenk.lesecommercelivros.repository.EntradaEstoqueRepository;
import com.kauebenk.lesecommercelivros.repository.EstoqueRepository;
import com.kauebenk.lesecommercelivros.repository.FornecedorRepository;
import com.kauebenk.lesecommercelivros.repository.GrupoPrecificacaoRepository;
import com.kauebenk.lesecommercelivros.repository.LivroRepository;
import com.kauebenk.lesecommercelivros.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AdminService {

    private static final String PARAM_INATIVACAO_VENDA_MINIMA = "LIVRO_INATIVACAO_VALOR_MINIMO_VENDAS";
    private static final String CATEGORIA_INATIVACAO_AUTOMATICA = "Fora de mercado";
    private static final String MOTIVO_INATIVACAO_AUTOMATICA =
            "Inativação automática por ausência de estoque e baixa venda.";

    @Autowired
    private LivroRepository livroRepository;

    @Autowired
    private AutorRepository autorRepository;

    @Autowired
    private EditoraRepository editoraRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private GrupoPrecificacaoRepository grupoPrecificacaoRepository;

    @Autowired
    private CategoriaAtivacaoRepository categoriaAtivacaoRepository;

    @Autowired
    private CategoriaInativacaoRepository categoriaInativacaoRepository;

    @Autowired
    private FornecedorRepository fornecedorRepository;

    @Autowired
    private EntradaEstoqueRepository entradaEstoqueRepository;

    @Autowired
    private EstoqueRepository estoqueRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private ParametroSistemaService parametroSistemaService;

    @Autowired
    private TransacaoLogService transacaoLogService;

    public PaginatedResponse<Livro> getAllLivros(Pageable pageable) {
        Page<Livro> page = livroRepository.findAll(pageable);
        return new PaginatedResponse<>(page);
    }

    @Transactional
    public Livro createLivro(Map<String, Object> request) {
        Livro livro = new Livro();
        applyLivroPayload(livro, request, false);

        livroRepository.findByIsbn(livro.getIsbn())
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ISBN já cadastrado.");
                });

        if (livro.getAtivo() == null) {
            livro.setAtivo(true);
        }

        Livro saved = livroRepository.save(livro);
        transacaoLogService.registrar("LIVRO", saved.getId(), OperacaoLog.INSERT, null, toLivroSnapshot(saved));
        return saved;
    }

    @Transactional
    public void updateLivro(Long id, Map<String, Object> request) {
        Livro livro = livroRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Livro não encontrado."));
        Map<String, Object> snapshotAnterior = toLivroSnapshot(livro);

        String isbnRequest = asString(request.get("isbn"));
        if (isbnRequest != null && !isbnRequest.isBlank()) {
            String normalized = normalizeIsbn(isbnRequest);
            livroRepository.findByIsbn(normalized).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ISBN já cadastrado.");
                }
            });
        }

        applyLivroPayload(livro, request, true);
        Livro saved = livroRepository.save(livro);
        transacaoLogService.registrar("LIVRO", saved.getId(), OperacaoLog.UPDATE, snapshotAnterior, toLivroSnapshot(saved));
    }

    @Transactional
    public void inativarLivro(Long id, Map<String, Object> req) {
        Livro livro = livroRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Livro não encontrado."));
        Map<String, Object> snapshotAnterior = toLivroSnapshot(livro);

        String motivo = firstNonBlank(
                asString(req.get("motivo")),
                asString(req.get("motivoInativacao"))
        );
        if (motivo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Motivo de inativação é obrigatório.");
        }

        Long categoriaId = extractId(req, "categoriaInativacaoId", "categoriaInativacao");
        if (categoriaId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria de inativação é obrigatória.");
        }

        CategoriaInativacao categoria = categoriaInativacaoRepository.findById(categoriaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria de inativação inválida."));

        livro.setAtivo(false);
        livro.setMotivoInativacao(motivo);
        livro.setCategoriaInativacao(categoria);

        Livro saved = livroRepository.save(livro);
        transacaoLogService.registrar("LIVRO", saved.getId(), OperacaoLog.UPDATE, snapshotAnterior, toLivroSnapshot(saved));
    }

    @Transactional
    public void ativarLivro(Long id, Map<String, Object> req) {
        Livro livro = livroRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Livro não encontrado."));
        Map<String, Object> snapshotAnterior = toLivroSnapshot(livro);

        String motivo = firstNonBlank(
                asString(req.get("motivo")),
                asString(req.get("motivoAtivacao"))
        );
        if (motivo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Motivo de ativação é obrigatório.");
        }

        Long categoriaId = extractId(req, "categoriaAtivacaoId", "categoriaAtivacao");
        if (categoriaId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria de ativação é obrigatória.");
        }

        CategoriaAtivacao categoria = categoriaAtivacaoRepository.findById(categoriaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria de ativação inválida."));

        livro.setAtivo(true);
        livro.setMotivoAtivacao(motivo);
        livro.setCategoriaAtivacao(categoria);

        Livro saved = livroRepository.save(livro);
        transacaoLogService.registrar("LIVRO", saved.getId(), OperacaoLog.UPDATE, snapshotAnterior, toLivroSnapshot(saved));
    }

    public List<GrupoPrecificacao> getPricingGroups() {
        return grupoPrecificacaoRepository.findAll();
    }

    public List<Fornecedor> getFornecedores() {
        return fornecedorRepository.findAll();
    }

    public PaginatedResponse<EntradaEstoque> getStockEntries(Long livroId, Pageable pageable) {
        Page<EntradaEstoque> page = livroId != null
                ? entradaEstoqueRepository.findByLivroId(livroId, pageable)
                : entradaEstoqueRepository.findAll(pageable);
        return new PaginatedResponse<>(page);
    }

    @Transactional
    public EntradaEstoque createStockEntry(Map<String, Object> request) {
        Long livroId = asLong(request.get("livroId"));
        Long fornecedorId = asLong(request.get("fornecedorId"));
        Integer quantidade = asInteger(request.get("quantidade"));
        BigDecimal valorCusto = asBigDecimal(request.get("valorCusto"));
        LocalDate dataEntrada = asLocalDate(request.get("dataEntrada"));

        if (livroId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Livro é obrigatório.");
        if (fornecedorId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fornecedor é obrigatório.");
        if (quantidade == null || quantidade <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantidade inválida.");
        if (valorCusto == null || valorCusto.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valor de custo inválido.");
        }
        if (dataEntrada == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Data de entrada é obrigatória.");

        Livro livro = livroRepository.findById(livroId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Livro não encontrado."));
        Fornecedor fornecedor = fornecedorRepository.findById(fornecedorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fornecedor não encontrado."));

        EntradaEstoque entrada = new EntradaEstoque();
        entrada.setLivro(livro);
        entrada.setQuantidade(quantidade);
        entrada.setValorCusto(valorCusto);
        entrada.setFornecedor(fornecedor);
        entrada.setDataEntrada(dataEntrada);
        entrada = entradaEstoqueRepository.save(entrada);

        Estoque estoque = estoqueRepository.findByLivroId(livroId).orElseGet(() -> {
            Estoque novo = new Estoque();
            novo.setLivro(livro);
            novo.setQuantidadeTotal(0);
            novo.setQuantidadeBloqueada(0);
            novo.setQuantidadeDisponivel(0);
            return novo;
        });

        int totalAnterior = safeInt(estoque.getQuantidadeTotal());
        int bloqueado = safeInt(estoque.getQuantidadeBloqueada());
        int totalAtualizado = totalAnterior + quantidade;

        estoque.setQuantidadeTotal(totalAtualizado);
        estoque.setQuantidadeBloqueada(bloqueado);
        estoque.setQuantidadeDisponivel(Math.max(0, totalAtualizado - bloqueado));
        estoqueRepository.save(estoque);

        if (livro.getGrupoPrecificacao() != null && livro.getGrupoPrecificacao().getMargemLucro() != null) {
            BigDecimal margem = livro.getGrupoPrecificacao().getMargemLucro();
            BigDecimal novoValorVenda = valorCusto.add(valorCusto.multiply(margem));
            if (livro.getValorVenda() == null || novoValorVenda.compareTo(livro.getValorVenda()) > 0) {
                Map<String, Object> snapshotAnterior = toLivroSnapshot(livro);
                livro.setValorVenda(novoValorVenda);
                Livro updated = livroRepository.save(livro);
                transacaoLogService.registrar(
                        "LIVRO",
                        updated.getId(),
                        OperacaoLog.UPDATE,
                        snapshotAnterior,
                        toLivroSnapshot(updated)
                );
            }
        }

        transacaoLogService.registrar("ENTRADA_ESTOQUE", entrada.getId(), OperacaoLog.INSERT, null, toEntradaEstoqueSnapshot(entrada));
        return entrada;
    }

    @Transactional
    public Map<String, Object> executarInativacaoAutomaticaLivros() {
        BigDecimal valorMinimo = parametroSistemaService.getBigDecimal(PARAM_INATIVACAO_VENDA_MINIMA, BigDecimal.ZERO);
        CategoriaInativacao categoriaAutomatica = categoriaInativacaoRepository
                .findFirstByDescricaoIgnoreCase(CATEGORIA_INATIVACAO_AUTOMATICA)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Categoria de inativação automática não configurada."
                ));

        List<StatusPedido> statusAprovados = List.of(
                StatusPedido.APROVADA,
                StatusPedido.EM_TRANSITO,
                StatusPedido.ENTREGUE,
                StatusPedido.EM_TROCA,
                StatusPedido.TROCA_AUTORIZADA,
                StatusPedido.TROCADO
        );

        List<Livro> livrosAtivos = livroRepository.findByAtivoTrue();
        int analisados = 0;
        int inativados = 0;
        List<Map<String, Object>> livrosInativados = new ArrayList<>();

        for (Livro livro : livrosAtivos) {
            analisados++;

            Estoque estoque = estoqueRepository.findByLivroId(livro.getId()).orElse(null);
            int disponivel = estoque == null ? 0 : safeInt(estoque.getQuantidadeDisponivel());
            if (disponivel > 0) {
                continue;
            }

            BigDecimal vendas = pedidoRepository.sumValorVendidoByLivroIdAndStatusIn(livro.getId(), statusAprovados);
            if (vendas == null) {
                vendas = BigDecimal.ZERO;
            }
            if (vendas.compareTo(valorMinimo) > 0) {
                continue;
            }

            Map<String, Object> snapshotAnterior = toLivroSnapshot(livro);
            livro.setAtivo(false);
            livro.setMotivoInativacao(MOTIVO_INATIVACAO_AUTOMATICA);
            livro.setCategoriaInativacao(categoriaAutomatica);
            Livro atualizado = livroRepository.save(livro);
            transacaoLogService.registrar(
                    "LIVRO",
                    atualizado.getId(),
                    OperacaoLog.UPDATE,
                    snapshotAnterior,
                    toLivroSnapshot(atualizado)
            );

            inativados++;
            Map<String, Object> item = new HashMap<>();
            item.put("livroId", atualizado.getId());
            item.put("titulo", atualizado.getTitulo());
            item.put("vendasAprovadas", vendas);
            livrosInativados.add(item);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("analisados", analisados);
        response.put("inativados", inativados);
        response.put("valorMinimoVendas", valorMinimo);
        response.put("livrosInativados", livrosInativados);
        return response;
    }

    private void applyLivroPayload(Livro livro, Map<String, Object> request, boolean partial) {
        String titulo = asString(request.get("titulo"));
        if (titulo != null) livro.setTitulo(titulo.trim());
        if (!partial && isBlank(livro.getTitulo())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Título é obrigatório.");

        Long autorId = extractId(request, "autorId", "autor");
        if (autorId != null) {
            Autor autor = autorRepository.findById(autorId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Autor inválido."));
            livro.setAutor(autor);
        }
        if (!partial && livro.getAutor() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Autor é obrigatório.");

        Long editoraId = extractId(request, "editoraId", "editora");
        if (editoraId != null) {
            Editora editora = editoraRepository.findById(editoraId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Editora inválida."));
            livro.setEditora(editora);
        }
        if (!partial && livro.getEditora() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Editora é obrigatória.");

        Integer ano = asInteger(request.get("ano"));
        if (ano != null) livro.setAno(ano);
        if (!partial && livro.getAno() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ano é obrigatório.");

        String edicao = asString(request.get("edicao"));
        if (edicao != null) livro.setEdicao(edicao.trim());
        if (!partial && isBlank(livro.getEdicao())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Edição é obrigatória.");

        String isbn = asString(request.get("isbn"));
        if (isbn != null) livro.setIsbn(normalizeIsbn(isbn));
        if (!partial && isBlank(livro.getIsbn())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ISBN é obrigatório.");

        Integer numeroPaginas = asInteger(request.get("numeroPaginas"));
        if (numeroPaginas != null) livro.setNumeroPaginas(numeroPaginas);
        if (!partial && livro.getNumeroPaginas() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Número de páginas é obrigatório.");
        }

        String sinopse = asString(request.get("sinopse"));
        if (sinopse != null) livro.setSinopse(sinopse.trim());
        if (!partial && isBlank(livro.getSinopse())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sinopse é obrigatória.");

        Double altura = asDouble(request.get("altura"));
        if (altura != null) livro.setAltura(altura);
        if (!partial && livro.getAltura() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Altura é obrigatória.");

        Double largura = asDouble(request.get("largura"));
        if (largura != null) livro.setLargura(largura);
        if (!partial && livro.getLargura() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Largura é obrigatória.");

        Double profundidade = asDouble(request.get("profundidade"));
        if (profundidade != null) livro.setProfundidade(profundidade);
        if (!partial && livro.getProfundidade() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profundidade é obrigatória.");
        }

        Double peso = asDouble(request.get("peso"));
        if (peso != null) livro.setPeso(peso);
        if (!partial && livro.getPeso() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Peso é obrigatório.");

        String codigoBarras = asString(request.get("codigoBarras"));
        if (codigoBarras != null) livro.setCodigoBarras(codigoBarras.trim());
        if (!partial && isBlank(livro.getCodigoBarras())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código de barras é obrigatório.");
        }

        Long grupoPrecificacaoId = extractId(request, "grupoPrecificacaoId", "grupoPrecificacao");
        if (grupoPrecificacaoId != null) {
            GrupoPrecificacao grupo = grupoPrecificacaoRepository.findById(grupoPrecificacaoId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Grupo de precificação inválido."));
            livro.setGrupoPrecificacao(grupo);
        }
        if (!partial && livro.getGrupoPrecificacao() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Grupo de precificação é obrigatório.");
        }

        Set<Long> categoriaIds = extractCategoriaIds(request);
        if (!categoriaIds.isEmpty()) {
            List<Categoria> categorias = categoriaRepository.findAllById(categoriaIds);
            if (categorias.size() != categoriaIds.size()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uma ou mais categorias são inválidas.");
            }
            livro.setCategorias(new HashSet<>(categorias));
        } else if (request.containsKey("categoriaIds") || request.containsKey("categorias")) {
            livro.setCategorias(new HashSet<>());
        }
        if (!partial && (livro.getCategorias() == null || livro.getCategorias().isEmpty())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ao menos uma categoria é obrigatória.");
        }

        BigDecimal precoVenda = asBigDecimal(firstNonNull(request.get("precoVenda"), request.get("valorVenda")));
        if (precoVenda != null) livro.setValorVenda(precoVenda);

        Boolean ativo = asBoolean(request.get("ativo"));
        if (ativo != null) livro.setAtivo(ativo);
    }

    private Set<Long> extractCategoriaIds(Map<String, Object> request) {
        Set<Long> ids = new HashSet<>();
        Object categoriaIds = request.get("categoriaIds");
        if (categoriaIds instanceof List<?> list) {
            for (Object value : list) {
                Long id = asLong(value);
                if (id != null) ids.add(id);
            }
        }

        Object categorias = request.get("categorias");
        if (categorias instanceof List<?> list) {
            for (Object value : list) {
                if (value instanceof Map<?, ?> map) {
                    Long id = asLong(map.get("id"));
                    if (id != null) ids.add(id);
                } else {
                    Long id = asLong(value);
                    if (id != null) ids.add(id);
                }
            }
        }
        return ids;
    }

    private Long extractId(Map<String, Object> request, String directKey, String nestedKey) {
        Long direct = asLong(request.get(directKey));
        if (direct != null) return direct;

        Object nested = request.get(nestedKey);
        if (nested instanceof Map<?, ?> map) {
            return asLong(map.get("id"));
        }
        return asLong(nested);
    }

    private String normalizeIsbn(String isbn) {
        return isbn == null ? null : isbn.replaceAll("[-\\s]", "").trim();
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) return first.trim();
        if (second != null && !second.isBlank()) return second.trim();
        return null;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private Object firstNonNull(Object first, Object second) {
        return first != null ? first : second;
    }

    private String asString(Object value) {
        if (value == null) return null;
        String text = String.valueOf(value);
        return text.trim();
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

    private Integer asInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.intValue();
        try {
            return Integer.parseInt(String.valueOf(value).trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Double asDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.doubleValue();
        try {
            return Double.parseDouble(String.valueOf(value).trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private BigDecimal asBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal decimal) return decimal;
        if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
        try {
            return new BigDecimal(String.valueOf(value).trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Boolean asBoolean(Object value) {
        if (value == null) return null;
        if (value instanceof Boolean bool) return bool;
        String text = String.valueOf(value).trim().toLowerCase();
        if ("true".equals(text)) return true;
        if ("false".equals(text)) return false;
        return null;
    }

    private LocalDate asLocalDate(Object value) {
        if (value == null) return null;
        try {
            return LocalDate.parse(String.valueOf(value).trim());
        } catch (Exception ex) {
            return null;
        }
    }

    private Map<String, Object> toLivroSnapshot(Livro livro) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("id", livro.getId());
        snapshot.put("titulo", livro.getTitulo());
        snapshot.put("isbn", livro.getIsbn());
        snapshot.put("codigoBarras", livro.getCodigoBarras());
        snapshot.put("valorVenda", livro.getValorVenda());
        snapshot.put("ativo", livro.getAtivo());
        snapshot.put("motivoInativacao", livro.getMotivoInativacao());
        snapshot.put("motivoAtivacao", livro.getMotivoAtivacao());
        snapshot.put("categoriaInativacaoId", livro.getCategoriaInativacao() != null ? livro.getCategoriaInativacao().getId() : null);
        snapshot.put("categoriaAtivacaoId", livro.getCategoriaAtivacao() != null ? livro.getCategoriaAtivacao().getId() : null);
        return snapshot;
    }

    private Map<String, Object> toEntradaEstoqueSnapshot(EntradaEstoque entrada) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("id", entrada.getId());
        snapshot.put("livroId", entrada.getLivro() != null ? entrada.getLivro().getId() : null);
        snapshot.put("fornecedorId", entrada.getFornecedor() != null ? entrada.getFornecedor().getId() : null);
        snapshot.put("quantidade", entrada.getQuantidade());
        snapshot.put("valorCusto", entrada.getValorCusto());
        snapshot.put("dataEntrada", entrada.getDataEntrada());
        return snapshot;
    }
}
