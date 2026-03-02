package com.tasko.backend.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    boolean existsByProjectIdAndUserId(Long projectId, Long userId);

    List<ProjectMember> findAllByUserId(Long userId);

    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);

    List<ProjectMember> findAllByProjectId(Long projectId);

    List<ProjectMember> findAllByUserIdAndRole(Long userId, ProjectRole role);

    void deleteByProjectIdAndUserId(Long projectId, Long userId);

    void deleteAllByProjectId(Long projectId);
}
