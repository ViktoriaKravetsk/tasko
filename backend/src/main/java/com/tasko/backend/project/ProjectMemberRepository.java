package com.tasko.backend.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    List<ProjectMember> findAllByProjectIdAndRole(Long projectId, ProjectRole role);

    @Query("""
            select p
            from ProjectMember pm, Project p
            where pm.projectId = p.id
              and pm.userId = :userId
              and pm.role = com.tasko.backend.project.ProjectRole.STUDENT
            order by p.createdAt desc
            """)
    List<Project> findStudentProjects(@Param("userId") Long userId);

    @Query("""
            select p
            from ProjectMember pm, Project p
            where pm.projectId = p.id
              and pm.userId = :userId
              and pm.role = com.tasko.backend.project.ProjectRole.STUDENT
              and lower(p.name) like concat('%', lower(:search), '%')
            order by p.createdAt desc
            """)
    List<Project> findStudentProjectsBySearch(@Param("userId") Long userId, @Param("search") String search);
}