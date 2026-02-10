package com.tasko.backend.task;

import com.tasko.backend.project.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@org.springframework.test.context.ActiveProfiles("test")
@Transactional
class TaskServiceTest {

    @Autowired TaskService taskService;
    @Autowired TaskRepository taskRepository;

    @Autowired ProjectService projectService;
    @Autowired ProjectMemberRepository memberRepository;

    private ProjectResponse createProject(Long ownerId) {
        return projectService.create(ownerId, new ProjectCreateRequest("P", null, null));
    }

    @Test
    void create_allowsOnlyOwner_andSetsTodoStatus() {
        Long ownerId = 1L;
        Long studentId = 2L;

        ProjectResponse project = createProject(ownerId);

        memberRepository.save(ProjectMember.builder()
                .projectId(project.id())
                .userId(studentId)
                .role(ProjectRole.STUDENT)
                .build());
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> taskService.create(studentId, project.id(), new TaskCreateRequest("T", null, null, null))
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());

        TaskResponse created = taskService.create(ownerId, project.id(),
                new TaskCreateRequest("  Title  ", "  desc  ", LocalDate.now().plusDays(1), 100));

        assertNotNull(created.id());
        assertEquals(TaskStatus.TODO, created.status());
        assertEquals("Title", created.title());
    }

    @Test
    void list_requiresMember() {
        Long ownerId = 1L;
        Long outsiderId = 99L;

        ProjectResponse project = createProject(ownerId);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> taskService.list(outsiderId, project.id())
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void getById_returns404_ifTaskNotFound() {
        Long ownerId = 1L;
        ProjectResponse project = createProject(ownerId);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> taskService.getById(ownerId, project.id(), 99999L)
        );
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void update_requiresOwner() {
        Long ownerId = 1L;
        Long studentId = 2L;

        ProjectResponse project = createProject(ownerId);

        memberRepository.save(ProjectMember.builder()
                .projectId(project.id())
                .userId(studentId)
                .role(ProjectRole.STUDENT)
                .build());

        TaskResponse task = taskService.create(ownerId, project.id(),
                new TaskCreateRequest("T", null, null, null));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> taskService.update(studentId, project.id(), task.id(), new TaskUpdateRequest("X", null, null, null))
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void delete_removesTask_forOwner() {
        Long ownerId = 1L;
        ProjectResponse project = createProject(ownerId);

        TaskResponse task = taskService.create(ownerId, project.id(),
                new TaskCreateRequest("T", null, null, null));

        taskService.delete(ownerId, project.id(), task.id());

        assertTrue(taskRepository.findById(task.id()).isEmpty());
    }
}
