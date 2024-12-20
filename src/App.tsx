/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useMemo, useState } from 'react';
import * as todoService from './api/todos';
import { UserWarning } from './UserWarning';
import { Todo } from './types/Todo';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { TodoList } from './components/TodoList';
import { Filter } from './types/Filter';
import classNames from 'classnames';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>(Filter.all);
  const [errorMessage, setErrorMessage] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [todosInProcess, setTodosInProcess] = useState<number[]>([]);

  useEffect(() => {
    todoService
      .getTodos()
      .then(setTodos)
      .catch(() => {
        setErrorMessage('Unable to load todos');
        setTimeout(() => setErrorMessage(''), 3000);
      });
  }, []);
  const addTodo = ({ userId, title, completed }: Omit<Todo, 'id'>) => {
    setErrorMessage('');

    return todoService
      .postTodos({ userId, title, completed })
      .then(newTitle => {
        setTodos(currentTodo => [...currentTodo, newTitle]);
      })
      .catch(error => {
        setErrorMessage('Unable to add a todo');
        setTimeout(() => setErrorMessage(''), 3000);
        throw error;
      })
      .finally(() => {
        setTempTodo(null);
      });
  };

  const deleteTodo = (postId: number) => {
    setTodosInProcess(currentId => [...currentId, postId]);

    return todoService
      .deleteTodos(postId)
      .then(() => {
        setTodos(currentTodo => currentTodo.filter(todo => todo.id !== postId));
      })
      .catch(error => {
        setErrorMessage('Unable to delete a todo');
        setTimeout(() => setErrorMessage(''), 3000);
        throw error;
      })
      .finally(() => {
        setTodosInProcess(currentId => currentId.filter(id => id !== postId));
      });
  };

  const updateTodo = (
    todoId: number,
    newTitle: string,
    completed?: boolean,
  ) => {
    const todoToUpdate = todos.find(todo => todo.id === todoId);

    if (!todoToUpdate) {
      return;
    }

    const trimmedTitle = newTitle.trim();
    const updatedTodo = {
      ...todoToUpdate,
      title: trimmedTitle,
      completed: completed ?? todoToUpdate.completed,
    };

    setTodosInProcess(currentId => [...currentId, todoId]);

    return todoService
      .updateTodos(todoId, updatedTodo)
      .then(() => {
        setTodos(currentTodos =>
          currentTodos.map(todo => (todo.id === todoId ? updatedTodo : todo)),
        );
      })
      .catch(error => {
        setErrorMessage('Unable to update a todo');
        setTimeout(() => setErrorMessage(''), 3000);
        throw error;
      })
      .finally(() => {
        setTodosInProcess(currentId => currentId.filter(id => id !== todoId));
      });
  };

  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      if (filter === Filter.active) {
        return !todo.completed;
      }

      if (filter === Filter.completed) {
        return todo.completed;
      }

      return true;
    });
  }, [todos, filter]);

  if (!todoService.USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>
      <div className="todoapp__content">
        <Header
          todos={todos}
          onErrorMessage={setErrorMessage}
          onSubmit={addTodo}
          setTempTodo={setTempTodo}
          todosInProcess={todosInProcess}
          updateTodo={updateTodo}
        />
        <TodoList
          todos={filteredTodos}
          tempTodo={tempTodo}
          onDelete={deleteTodo}
          todosInProcess={todosInProcess}
          updateTodo={updateTodo}
        />
        {!!todos.length && (
          <Footer
            todos={todos}
            onFilter={setFilter}
            filter={filter}
            onDelete={deleteTodo}
          />
        )}
      </div>
      <div
        data-cy="ErrorNotification"
        className={classNames(
          'notification is-danger is-light has-text-weight-normal',
          { hidden: !errorMessage },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setErrorMessage('')}
        />
        {errorMessage}
      </div>
    </div>
  );
};
