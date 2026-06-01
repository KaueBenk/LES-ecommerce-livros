package com.kauebenk.lesecommercelivros.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Livro {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String titulo;
    
    @ManyToOne(optional = false)
    private Autor autor;
    
    @ManyToMany
    @JoinTable(
        name = "livro_categoria",
        joinColumns = @JoinColumn(name = "livro_id"),
        inverseJoinColumns = @JoinColumn(name = "categoria_id")
    )
    private Set<Categoria> categorias;
    
    @Column(nullable = false)
    private Integer ano;
    
    @ManyToOne(optional = false)
    private Editora editora;
    
    @Column(nullable = false)
    private String edicao;
    
    @Column(nullable = false, unique = true)
    private String isbn;
    
    @Column(nullable = false)
    private Integer numeroPaginas;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String sinopse;
    
    @Column(nullable = false)
    private Double altura;
    
    @Column(nullable = false)
    private Double largura;
    
    @Column(nullable = false)
    private Double peso;
    
    @Column(nullable = false)
    private Double profundidade;
    
    @ManyToOne(optional = false)
    private GrupoPrecificacao grupoPrecificacao;
    
    @Column(nullable = false)
    private String codigoBarras;
    
    private BigDecimal valorVenda;
    
    private Boolean ativo = true;
    
    private String motivoInativacao;
    
    @ManyToOne
    private CategoriaInativacao categoriaInativacao;
    
    private String motivoAtivacao;
    
    @ManyToOne
    private CategoriaAtivacao categoriaAtivacao;

    @OneToOne(mappedBy = "livro")
    private Estoque estoque;

    @Transient
    public Integer getQuantidadeEstoque() {
        return estoque != null ? estoque.getQuantidadeTotal() : 0;
    }
}
