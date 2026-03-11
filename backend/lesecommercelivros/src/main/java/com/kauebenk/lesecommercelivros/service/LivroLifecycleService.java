package com.kauebenk.lesecommercelivros.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class LivroLifecycleService {

    @Autowired
    private AdminService adminService;

    @Scheduled(cron = "${app.livros.auto-inativacao-cron:0 0/30 * * * *}")
    public void executarInativacaoAutomaticaAgendada() {
        adminService.executarInativacaoAutomaticaLivros();
    }
}
