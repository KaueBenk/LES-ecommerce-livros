package com.kauebenk.lesecommercelivros.security;

import com.kauebenk.lesecommercelivros.entity.Cliente;
import com.kauebenk.lesecommercelivros.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private ClienteRepository clienteRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Cliente cliente = clienteRepository.findFirstByEmailIgnoreCaseOrderByIdAsc(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        if (Boolean.FALSE.equals(cliente.getAtivo())) {
            throw new UsernameNotFoundException("User inactive with email: " + email);
        }

        return new User(cliente.getEmail(), cliente.getSenha(), Collections.singletonList(new SimpleGrantedAuthority(cliente.getRole())));
    }
}
