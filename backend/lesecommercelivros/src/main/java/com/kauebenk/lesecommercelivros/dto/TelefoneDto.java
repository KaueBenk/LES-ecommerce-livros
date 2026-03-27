package com.kauebenk.lesecommercelivros.dto;

import com.kauebenk.lesecommercelivros.entity.enums.TipoTelefone;
import lombok.Data;

@Data
public class TelefoneDto {
    private TipoTelefone tipo;
    private String ddd;
    private String numero;
}
