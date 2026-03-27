package com.kauebenk.lesecommercelivros.dto;

import com.kauebenk.lesecommercelivros.entity.enums.TipoEndereco;
import com.kauebenk.lesecommercelivros.entity.enums.TipoLogradouro;
import com.kauebenk.lesecommercelivros.entity.enums.TipoResidencia;
import lombok.Data;

@Data
public class EnderecoDto {
    private String apelido;
    private TipoResidencia tipoResidencia;
    private TipoLogradouro tipoLogradouro;
    private String logradouro;
    private String numero;
    private String bairro;
    private String cep;
    private String cidade;
    private String estado;
    private String pais;
    private TipoEndereco tipoEndereco;
}
