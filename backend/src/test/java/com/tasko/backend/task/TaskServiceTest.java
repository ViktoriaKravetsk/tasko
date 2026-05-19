package com.tasko.backend.task;

import com.tasko.backend.exception.ForbiddenException;
import com.tasko.backend.exception.NotFoundException;
import com.tasko.backend.project.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
        return projectService.create(ownerId, new ProjectCreateRequest("P", null, null, null));
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
        ForbiddenException ex = assertThrows(
                ForbiddenException.class,
                () -> taskService.create(studentId, project.id(), new TaskCreateRequest("T", null, null, 100))
        );
        assertEquals("Only OWNER can do this", ex.getMessage());

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

        ForbiddenException ex = assertThrows(
                ForbiddenException.class,
                () -> taskService.list(outsiderId, project.id(), null, null)
        );
        assertEquals("Not a project member", ex.getMessage());
    }

    @Test
    void getById_returns404_ifTaskNotFound() {
        Long ownerId = 1L;
        ProjectResponse project = createProject(ownerId);

        NotFoundException ex = assertThrows(
                NotFoundException.class,
                () -> taskService.getById(ownerId, project.id(), 99999L)
        );
        assertEquals("Task not found", ex.getMessage());
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
                new TaskCreateRequest("T", null, null, 100));

        ForbiddenException ex = assertThrows(
                ForbiddenException.class,
                () -> taskService.update(studentId, project.id(), task.id(), new TaskUpdateRequest("X", null, null, null))
        );
        assertEquals("Only OWNER can do this", ex.getMessage());
    }

    @Test
    void delete_removesTask_forOwner() {
        Long ownerId = 1L;
        ProjectResponse project = createProject(ownerId);

        TaskResponse task = taskService.create(ownerId, project.id(),
                new TaskCreateRequest("T", null, null, 100));

        taskService.delete(ownerId, project.id(), task.id());

        assertTrue(taskRepository.findById(task.id()).isEmpty());
    }
}
