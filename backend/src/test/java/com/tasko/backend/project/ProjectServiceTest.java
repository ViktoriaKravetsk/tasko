package com.tasko.backend.project;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@org.springframework.test.context.ActiveProfiles("test")
@Transactional
class ProjectServiceTest {

    @Autowired ProjectService projectService;
    @Autowired ProjectRepository projectRepository;
    @Autowired ProjectMemberRepository memberRepository;

    @Test
    void create_createsProjectAndOwnerMembership() {
        Long ownerId = 1L;

        ProjectCreateRequest req = new ProjectCreateRequest("  My project  ", "  desc  ", null);
        ProjectResponse res = projectService.create(ownerId, req);

        assertNotNull(res.id());
        assertEquals("My project", res.name());
        assertNotNull(res.joinCode());
        assertFalse(res.joinCode().isBlank());

        assertTrue(memberRepository.existsByProjectIdAndUserId(res.id(), ownerId));
    }

    @Test
    void joinByCode_returns404_ifProjectNotFound() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> projectService.joinByCode(2L, "ABCDEFGH")
        );
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void joinByCode_returns403_ifProjectInactive() {
        Long ownerId = 1L;
        ProjectResponse created = projectService.create(ownerId, new ProjectCreateRequest("P", null, null));

        Project p = projectRepository.findById(created.id()).orElseThrow();
        p.setActive(false);
        projectRepository.save(p);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> projectService.joinByCode(2L, created.joinCode())
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void joinByCode_returns403_ifJoinDisabled() {
        Long ownerId = 1L;
        ProjectResponse created = projectService.create(ownerId, new ProjectCreateRequest("P", null, null));

        Project p = projectRepository.findById(created.id()).orElseThrow();
        p.setJoinEnabled(false);
        projectRepository.save(p);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> projectService.joinByCode(2L, created.joinCode())
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void joinByCode_isIdempotent_forSameUser() {
        Long ownerId = 1L;
        Long studentId = 2L;

        ProjectResponse created = projectService.create(ownerId, new ProjectCreateRequest("P", null, null));

        ProjectResponse first = projectService.joinByCode(studentId, created.joinCode());
        ProjectResponse second = projectService.joinByCode(studentId, created.joinCode());

        assertEquals(created.id(), first.id());
        assertEquals(created.id(), second.id());
        long count = memberRepository.findAllByUserId(studentId).stream()
                .filter(m -> m.getProjectId().equals(created.id()))
                .count();
        assertEquals(1L, count);
    }

    @Test
    void listMy_returnsOnlyOwnedProjects() {
        Long owner1 = 1L;
        Long owner2 = 2L;

        ProjectResponse p1 = projectService.create(owner1, new ProjectCreateRequest("A", null, null));
        projectService.create(owner2, new ProjectCreateRequest("B", null, null));

        var my = projectService.listMy(owner1);

        assertTrue(my.stream().anyMatch(p -> p.id().equals(p1.id())));
        assertTrue(my.stream().noneMatch(p -> "B".equals(p.name())));
    }

    @Test
    void listEnrolled_returnsOnlyStudentProjects() {
        Long ownerId = 1L;
        Long studentId = 2L;

        ProjectResponse p = projectService.create(ownerId, new ProjectCreateRequest("P", null, null));
        projectService.joinByCode(studentId, p.joinCode());

        var enrolled = projectService.listEnrolled(studentId);

        assertEquals(1, enrolled.size());
        assertEquals(p.id(), enrolled.get(0).id());
    }
}
