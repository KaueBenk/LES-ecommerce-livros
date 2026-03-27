package com.kauebenk.lesecommercelivros.dto;

import com.kauebenk.lesecommercelivros.entity.enums.Genero;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class RegisterRequest {
    private String nome;
    private Genero genero;
    private String cpf;
    private LocalDate dataNascimento;
    private String email;
    private String senha;
    private String confirmacaoSenha;
    private List<TelefoneDto> telefones;
    private List<EnderecoDto> enderecos;
}
