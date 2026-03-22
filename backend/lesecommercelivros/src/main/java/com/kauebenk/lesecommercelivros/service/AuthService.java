package com.kauebenk.lesecommercelivros.service;

import com.kauebenk.lesecommercelivros.dto.EnderecoDto;
import com.kauebenk.lesecommercelivros.dto.LoginRequest;
import com.kauebenk.lesecommercelivros.dto.RegisterRequest;
import com.kauebenk.lesecommercelivros.dto.TelefoneDto;
import com.kauebenk.lesecommercelivros.entity.Cliente;
import com.kauebenk.lesecommercelivros.entity.Endereco;
import com.kauebenk.lesecommercelivros.entity.Telefone;
import com.kauebenk.lesecommercelivros.entity.enums.OperacaoLog;
import com.kauebenk.lesecommercelivros.entity.enums.TipoEndereco;
import com.kauebenk.lesecommercelivros.repository.ClienteRepository;
import com.kauebenk.lesecommercelivros.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class AuthService {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private TransacaoLogService transacaoLogService;

    public Map<String, Object> register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        String normalizedCpf = normalizeCpf(request.getCpf());

        validateDadosBasicosCadastro(request, normalizedEmail, normalizedCpf);
        validateTelefones(request.getTelefones());
        validateEnderecos(request.getEnderecos());

        if (clienteRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            log.warn("[AUTH] Tentativa de registro com email duplicado - Email: {}", normalizedEmail);
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado.");
        }

        if (clienteRepository.existsByCpf(normalizedCpf)) {
            log.warn("[AUTH] Tentativa de registro com CPF duplicado - CPF: {}", normalizedCpf);
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CPF já cadastrado.");
        }

        if (!request.getSenha().equals(request.getConfirmacaoSenha())) {
            log.warn("[AUTH] Tentativa de registro com confirmação de senha inválida - Email: {}", normalizedEmail);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Confirmação de senha inválida.");
        }

        if (!isStrongPassword(request.getSenha())) {
            log.warn("[AUTH] Tentativa de registro com senha fraca - Email: {}", normalizedEmail);
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A senha deve conter no mínimo 8 caracteres, letras maiúsculas, minúsculas e caractere especial"
            );
        }

        Cliente cliente = new Cliente();
        cliente.setNome(request.getNome().trim());
        cliente.setEmail(normalizedEmail);
        cliente.setCpf(normalizedCpf);
        cliente.setSenha(passwordEncoder.encode(request.getSenha()));
        cliente.setGenero(request.getGenero());
        cliente.setDataNascimento(request.getDataNascimento());
        cliente.setAtivo(true);

        List<Telefone> telefones = new ArrayList<>();
        request.getTelefones().forEach(dto -> {
            Telefone telefone = new Telefone();
            telefone.setTipo(dto.getTipo());
            telefone.setDdd(dto.getDdd().trim());
            telefone.setNumero(dto.getNumero().trim());
            telefone.setCliente(cliente);
            telefones.add(telefone);
        });
        cliente.setTelefones(telefones);

        List<Endereco> enderecos = new ArrayList<>();
        request.getEnderecos().forEach(dto -> {
            Endereco endereco = new Endereco();
            endereco.setApelido(isBlank(dto.getApelido()) ? "Endereço" : dto.getApelido().trim());
            endereco.setTipoResidencia(dto.getTipoResidencia());
            endereco.setTipoLogradouro(dto.getTipoLogradouro());
            endereco.setLogradouro(dto.getLogradouro().trim());
            endereco.setNumero(dto.getNumero().trim());
            endereco.setBairro(dto.getBairro().trim());
            endereco.setCep(dto.getCep().trim());
            endereco.setCidade(dto.getCidade().trim());
            endereco.setEstado(dto.getEstado().trim().toUpperCase());
            endereco.setPais(isBlank(dto.getPais()) ? "Brasil" : dto.getPais().trim());
            endereco.setTipoEndereco(dto.getTipoEndereco());
            endereco.setCliente(cliente);
            enderecos.add(endereco);
        });
        cliente.setEnderecos(enderecos);

        Cliente savedCliente = clienteRepository.save(cliente);
        transacaoLogService.registrar(
                "CLIENTE",
                savedCliente.getId(),
                OperacaoLog.INSERT,
                null,
                toClienteSnapshot(savedCliente)
        );

        log.info("[AUTH] Novo usuário registrado - Email: {} - Nome: {} - Tipo: {}", 
                savedCliente.getEmail(), savedCliente.getNome(), savedCliente.getRole());

        Map<String, Object> response = new HashMap<>();
        response.put("id", savedCliente.getId());
        response.put("nome", savedCliente.getNome());
        response.put("email", savedCliente.getEmail());
        response.put("cpf", savedCliente.getCpf());
        response.put("token", tokenProvider.generateToken(savedCliente));

        return response;
    }

    public Map<String, Object> login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        Cliente cliente = clienteRepository.findFirstByEmailIgnoreCaseOrderByIdAsc(normalizedEmail)
                .orElseThrow(() -> {
                    log.warn("[AUTH] Tentativa de login falhada - Email: {} - Motivo: Usuário não encontrado", normalizedEmail);
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais invalidas");
                });

        if (!passwordEncoder.matches(request.getSenha(), cliente.getSenha())) {
            log.warn("[AUTH] Tentativa de login falhada - Email: {} - Motivo: Credenciais inválidas", normalizedEmail);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais invalidas");
        }
        if (Boolean.FALSE.equals(cliente.getAtivo())) {
            log.warn("[AUTH] Tentativa de login falhada - Email: {} - Motivo: Cliente inativo", normalizedEmail);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cliente inativo. Procure o suporte.");
        }

        log.info("[AUTH] Login bem-sucedido - Email: {} - Timestamp: {}", 
                cliente.getEmail(), java.time.LocalDateTime.now());

        Map<String, Object> response = new HashMap<>();
        response.put("id", cliente.getId());
        response.put("nome", cliente.getNome());
        response.put("email", cliente.getEmail());
        response.put("cpf", cliente.getCpf());
        response.put("role", cliente.getRole());
        response.put("ranking", cliente.getRanking());
        response.put("token", tokenProvider.generateToken(cliente));

        return response;
    }

    public void updateSenha(String atual, String nova, String confirmacao) {
        Cliente cliente = getAuthenticatedCliente();

        if (atual == null || atual.isBlank()) {
            log.warn("[AUTH] Tentativa de atualização de senha sem senha atual - Email: {}", cliente.getEmail());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha atual é obrigatória");
        }
        if (!passwordEncoder.matches(atual, cliente.getSenha())) {
            log.warn("[AUTH] Tentativa de atualização de senha com senha atual inválida - Email: {}", cliente.getEmail());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha atual inválida");
        }
        if (nova == null || nova.isBlank()) {
            log.warn("[AUTH] Tentativa de atualização de senha sem nova senha - Email: {}", cliente.getEmail());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nova senha é obrigatória");
        }
        if (confirmacao == null || !confirmacao.equals(nova)) {
            log.warn("[AUTH] Tentativa de atualização de senha com confirmação inválida - Email: {}", cliente.getEmail());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Confirmação de senha inválida");
        }
        if (!isStrongPassword(nova)) {
            log.warn("[AUTH] Tentativa de atualização de senha com senha fraca - Email: {}", cliente.getEmail());
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A senha deve conter no mínimo 8 caracteres, letras maiúsculas, minúsculas e caractere especial"
            );
        }

        Map<String, Object> snapshotAnterior = new HashMap<>();
        snapshotAnterior.put("id", cliente.getId());
        snapshotAnterior.put("senhaHash", cliente.getSenha());

        cliente.setSenha(passwordEncoder.encode(nova));
        Cliente saved = clienteRepository.save(cliente);

        Map<String, Object> snapshotNovo = new HashMap<>();
        snapshotNovo.put("id", saved.getId());
        snapshotNovo.put("senhaHash", saved.getSenha());

        transacaoLogService.registrar("CLIENTE", saved.getId(), OperacaoLog.UPDATE, snapshotAnterior, snapshotNovo);
        
        log.info("[AUTH] Senha atualizada com sucesso - Email: {}", cliente.getEmail());
    }

    private void validateDadosBasicosCadastro(RegisterRequest request, String normalizedEmail, String normalizedCpf) {
        if (request.getGenero() == null) {
            log.warn("[AUTH] Tentativa de registro sem gênero - Email: {}", normalizedEmail);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gênero é obrigatório.");
        }
        if (isBlank(request.getNome())) {
            log.warn("[AUTH] Tentativa de registro sem nome - Email: {}", normalizedEmail);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome é obrigatório.");
        }
        if (request.getDataNascimento() == null) {
            log.warn("[AUTH] Tentativa de registro sem data de nascimento - Email: {}", normalizedEmail);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Data de nascimento é obrigatória.");
        }
        if (isBlank(normalizedCpf)) {
            log.warn("[AUTH] Tentativa de registro sem CPF - Email: {}", normalizedEmail);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF é obrigatório.");
        }
        if (isBlank(normalizedEmail)) {
            log.warn("[AUTH] Tentativa de registro sem email");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email é obrigatório.");
        }
        if (isBlank(request.getSenha())) {
            log.warn("[AUTH] Tentativa de registro sem senha - Email: {}", normalizedEmail);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha é obrigatória.");
        }
        if (isBlank(request.getConfirmacaoSenha())) {
            log.warn("[AUTH] Tentativa de registro sem confirmação de senha - Email: {}", normalizedEmail);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Confirmação de senha é obrigatória.");
        }
    }

    private void validateTelefones(List<TelefoneDto> telefones) {
        if (telefones == null || telefones.isEmpty()) {
            log.warn("[AUTH] Tentativa de registro sem telefone");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ao menos um telefone é obrigatório.");
        }
        for (TelefoneDto telefone : telefones) {
            if (telefone == null || telefone.getTipo() == null || isBlank(telefone.getDdd()) || isBlank(telefone.getNumero())) {
                log.warn("[AUTH] Tentativa de registro com telefone inválido");
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Telefone deve conter tipo, DDD e número."
                );
            }
        }
    }

    private void validateEnderecos(List<EnderecoDto> enderecos) {
        if (enderecos == null || enderecos.isEmpty()) {
            log.warn("[AUTH] Tentativa de registro sem endereço");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ao menos um endereço é obrigatório.");
        }

        boolean temCobranca = false;
        boolean temEntrega = false;

        for (EnderecoDto endereco : enderecos) {
            if (endereco == null) {
                log.warn("[AUTH] Tentativa de registro com endereço nulo");
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Endereço inválido.");
            }
            if (endereco.getTipoResidencia() == null || endereco.getTipoLogradouro() == null) {
                log.warn("[AUTH] Tentativa de registro com endereço sem tipo de residência ou logradouro");
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de residência e tipo de logradouro são obrigatórios.");
            }
            if (isBlank(endereco.getLogradouro())
                    || isBlank(endereco.getNumero())
                    || isBlank(endereco.getBairro())
                    || isBlank(endereco.getCep())
                    || isBlank(endereco.getCidade())
                    || isBlank(endereco.getEstado())) {
                log.warn("[AUTH] Tentativa de registro com endereço incompleto");
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Endereço deve conter logradouro, número, bairro, CEP, cidade e estado."
                );
            }
            if (endereco.getTipoEndereco() == null) {
                log.warn("[AUTH] Tentativa de registro com endereço sem tipo");
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo do endereço é obrigatório.");
            }

            if (endereco.getTipoEndereco() == TipoEndereco.COBRANCA || endereco.getTipoEndereco() == TipoEndereco.AMBOS) {
                temCobranca = true;
            }
            if (endereco.getTipoEndereco() == TipoEndereco.ENTREGA || endereco.getTipoEndereco() == TipoEndereco.AMBOS) {
                temEntrega = true;
            }
        }

        if (!temCobranca) {
            log.warn("[AUTH] Tentativa de registro sem endereço de cobrança");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "É obrigatório possuir ao menos um endereço de cobrança.");
        }
        if (!temEntrega) {
            log.warn("[AUTH] Tentativa de registro sem endereço de entrega");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "É obrigatório possuir ao menos um endereço de entrega.");
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String normalizeCpf(String cpf) {
        return cpf == null ? "" : cpf.replaceAll("\\D", "");
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private boolean isStrongPassword(String senha) {
        if (senha == null || senha.length() < 8) return false;
        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasSpecial = false;
        for (char c : senha.toCharArray()) {
            if (Character.isUpperCase(c)) hasUpper = true;
            else if (Character.isLowerCase(c)) hasLower = true;
            else if (!Character.isDigit(c)) hasSpecial = true;
        }
        return hasUpper && hasLower && hasSpecial;
    }

    private Cliente getAuthenticatedCliente() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            log.warn("[AUTH] Tentativa de acesso sem autenticação");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado");
        }
        return clienteRepository.findFirstByEmailIgnoreCaseOrderByIdAsc(authentication.getName())
                .orElseThrow(() -> {
                    log.error("[AUTH] Cliente autenticado não encontrado no banco - Email: {}", authentication.getName());
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cliente não encontrado");
                });
    }

    private Map<String, Object> toClienteSnapshot(Cliente cliente) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("id", cliente.getId());
        snapshot.put("nome", cliente.getNome());
        snapshot.put("email", cliente.getEmail());
        snapshot.put("cpf", cliente.getCpf());
        snapshot.put("genero", cliente.getGenero() != null ? cliente.getGenero().name() : null);
        snapshot.put("dataNascimento", cliente.getDataNascimento());
        snapshot.put("ativo", cliente.getAtivo());
        snapshot.put("role", cliente.getRole());
        return snapshot;
    }
}
