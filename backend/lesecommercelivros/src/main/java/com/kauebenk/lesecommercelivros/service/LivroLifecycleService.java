package com.kauebenk.lesecommercelivros.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class LivroLifecycleService {

    @Autowired
    private AdminService adminService;

    @Scheduled(cron = "${app.livros.auto-inativacao-cron:0 0/30 * * * *}")
    public void executarInativacaoAutomaticaAgendada() {
        try {
            log.info("[LIVRO-LIFECYCLE] Iniciando inativação automática de livros agendada");
            adminService.executarInativacaoAutomaticaLivros();
            log.info("[LIVRO-LIFECYCLE] Inativação automática de livros concluída com sucesso");
        } catch (Exception e) {
            log.error("[LIVRO-LIFECYCLE] Erro ao executar inativação automática de livros", e);
        }
    }
}
