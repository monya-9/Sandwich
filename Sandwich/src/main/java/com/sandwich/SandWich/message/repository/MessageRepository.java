package com.sandwich.SandWich.message.repository;

import com.sandwich.SandWich.message.domain.Message;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, Long> { }