class StorageService {
    static set(name, data) {
        localStorage.setItem(name, JSON.stringify(data));
    }

    static get(name) {
        try {
            return JSON.parse(localStorage.getItem(name));
        } catch (error) {
            return null;
        }
    }

    static remove(name) {
        localStorage.removeItem(name);
    }

    static clearAll() {
        localStorage.clear();
    }
}

class TodoList {
    container = null;

    settings = {
        saveToLocalStorage: true,
        categoryContainerClassName: 'tag-list',
        categoryItemClassName: 'tag-item',
        todoContainerClassName: 'todo-list',
        todoContainerTitleClassName: 'todo-list-title',
        todoItemClassName: 'todo-item',
        todoAddClassName: 'todo-add',
    };

    categoryList = [];

    #dragstartTodoELem = null;

    constructor(selector, options = {}) {
        if (!selector) {
            throw new Error(`selector param is required - "new TodoList(selector)"`);
        }

        this.container = document.querySelector(selector);

        if (!this.container) {
            throw new Error(`Selector "${selector}" not finded`);
        }

        this.settings = {
            ...this.settings,
            ...options,
        };

        this.init();
    }

    get categoryActive() {
        return this.categoryList.find((category) => category.isActive);
    }

    get todoCompletedCount() {
        return this.categoryActive?.todoList.filter((todo) => todo.completed).length || '0';
    }

    get todoCount() {
        return this.categoryActive?.todoList.length || '0';
    }

    saveToStorage() {
        this.settings.saveToLocalStorage && StorageService.set('categoryList', this.categoryList);
    }

    categoryAdd() {
        let categoryName = prompt(`Введите название списка:`);

        if (categoryName) {
            this.categoryList.forEach((category) => (category.isActive = false));

            this.categoryList.push({
                id: Date.now(),
                name: categoryName,
                isActive: true,
                todoList: [],
            });

            this.render();
            this.setListeners();
            this.saveToStorage();
        }
    }

    categoryRemove(id) {
        if (!id) return;

        let findedCategory = this.categoryList.find((category) => category.id === id);
        let categoryIndex = this.categoryList.findIndex((category) => category.id === id);

        if (findedCategory && confirm(`Вы уверены что хотите удалить список "${findedCategory.name}"`)) {
            if (findedCategory.isActive) {
                this.categorySetActiveAfterRemove(categoryIndex);
            }
            this.categoryList = this.categoryList.filter((category) => category.id !== id);
            this.render();
            this.setListeners();
            this.saveToStorage();
        }
    }

    categorySetActiveAfterRemove(index) {
        let nextCategory = this.categoryList[index + 1];

        if (nextCategory) {
            nextCategory.isActive = true;
            return;
        }

        let prevCategory = this.categoryList[index - 1];

        if (prevCategory) {
            prevCategory.isActive = true;
            return;
        }
    }

    categoryEdit() {
        let categoryName = prompt(`Редактирование названия списка:`, this.categoryActive?.name || '');
        if (categoryName && this.categoryActive) {
            this.categoryActive.name = categoryName;
            this.render();
            this.setListeners();
            this.saveToStorage();
        }
    }

    categoryEditListener(event) {
        event.preventDefault();
        this.categoryEdit();
    }

    categoryItemListener(event) {
        event.preventDefault();

        let target = event.target;
        let currentTarget = event.currentTarget;

        if (target.dataset['function'] === 'category-remove') {
            this.categoryRemove(+currentTarget.dataset['categoryId']);
            return;
        }

        if (currentTarget.dataset['categoryId']) {
            this.categorySetActive(+currentTarget.dataset['categoryId']);
            return;
        }
    }

    categorySetActive(id) {
        if (!id) return;
        this.categoryList.forEach((category) => (category.isActive = category.id === id));
        this.render();
        this.setListeners();
        this.saveToStorage();
    }

    categoryAddListener(event) {
        event.preventDefault();
        this.categoryAdd();
    }

    todoToggleListener(event) {
        event.preventDefault();
        let todoId = event.target.value;
        this.todoToggle(+todoId);
    }

    todoRemoveListener(event) {
        event.preventDefault();
        event.stopPropagation();
        let todoId = event.target.closest('[data-todo-id]')?.dataset['todoId'];
        this.todoRemove(+todoId);
    }

    todoAddListener(event) {
        event.preventDefault();
        this.todoAdd();
    }

    todoEditListener(event) {
        event.preventDefault();
        let todoId = event.target.dataset['todoId'];
        this.todoEdit(+todoId);
    }

    todoEdit(id) {
        if (!id) return;
        let currentTodo = this.categoryActive?.todoList.find((todo) => todo.id === id);
        let newTodoName = prompt(`Редактирование задачи:`, currentTodo.name);

        if (currentTodo && newTodoName) {
            currentTodo.name = newTodoName;
            this.render();
            this.setListeners();
            this.saveToStorage();
        }
    }

    todoToggle(id) {
        if (!id) return;
        let currentTodo = this.categoryActive?.todoList.find((todo) => todo.id === id);
        if (currentTodo) {
            currentTodo.completed = !currentTodo.completed;
            this.render();
            this.setListeners();
            this.saveToStorage();
        }
    }

    todoRemove(id) {
        if (!id) return;
        let currentTodo = this.categoryActive?.todoList.find((todo) => todo.id === id);
        if (
            currentTodo &&
            this.categoryActive &&
            confirm(`Вы уверены что хотите удалить задачу "${currentTodo.name}"`)
        ) {
            this.categoryActive.todoList = this.categoryActive.todoList.filter((todo) => todo.id !== id);
            this.render();
            this.setListeners();
            this.saveToStorage();
        }
    }

    todoAdd() {
        let todoName = prompt(`Введите название задачи:`);

        if (todoName) {
            this.categoryActive?.todoList.push({
                id: Date.now(),
                name: todoName,
                completed: false,
            });
            this.render();
            this.setListeners();
            this.saveToStorage();
        }
    }

    todoMoveAfterDrag(fromId, toId) {
        if (!fromId && toId) return;

        let todoList = this.categoryActive?.todoList;
        let fromTodo = todoList?.find((todo) => todo.id === fromId);
        let toTodo = todoList?.find((todo) => todo.id === toId);
        let fromTodoIndex = todoList?.findIndex((todo) => todo.id === fromId);
        let toTodoIndex = todoList?.findIndex((todo) => todo.id === toId);

        if (fromTodo && toTodo) {
            todoList[fromTodoIndex] = toTodo;
            todoList[toTodoIndex] = fromTodo;
            this.render();
            this.setListeners();
            this.saveToStorage();
        }
    }

    todoDragStartListener(event) {
        this.#dragstartTodoELem = event.target;
    }

    todoDragOverListener(event) {
        event.preventDefault();
        event.target.classList.add('dragover');
    }

    todoDragLeaveListener(event) {
        event.target.classList.remove('dragover');
    }

    todoDropListener(event) {
        event.target.classList.remove('dragover');

        if (this.#dragstartTodoELem) {
            let todoFromId = this.#dragstartTodoELem.dataset['todoId'];
            let todoToId = event.target.dataset['todoId'];
            this.todoMoveAfterDrag(+todoFromId, +todoToId);
        }
    }

    setListeners() {
        let categoryElems = this.container.querySelectorAll(`[data-category-name]`);
        let categoryAddElem = this.container.querySelector('[data-function="category-add"]');
        let categoryEditElem = this.container.querySelector('[data-function="category-edit"]');

        let todoItemElems = this.container.querySelectorAll(`[data-todo-name]`);
        let todoToggleElems = this.container.querySelectorAll(`[data-function="todo-toggle"]`);
        let todoRemoveElems = this.container.querySelectorAll(`[data-function="todo-remove"]`);
        let todoAddElem = this.container.querySelector(`[data-function="todo-add"]`);

        categoryElems.forEach((category) => category.addEventListener('click', this.categoryItemListener.bind(this)));
        todoRemoveElems.forEach((todo) => todo.addEventListener('click', this.todoRemoveListener.bind(this)));
        todoToggleElems.forEach((todo) => todo.addEventListener('change', this.todoToggleListener.bind(this)));
        todoItemElems.forEach((todo) => {
            todo.addEventListener('dblclick', this.todoEditListener.bind(this));
            todo.addEventListener('dragstart', this.todoDragStartListener.bind(this));
            todo.addEventListener('dragover', this.todoDragOverListener.bind(this));
            todo.addEventListener('dragleave', this.todoDragLeaveListener.bind(this));
            todo.addEventListener('drop', this.todoDropListener.bind(this));
        });
        categoryAddElem?.addEventListener('click', this.categoryAddListener.bind(this));
        categoryEditElem?.addEventListener('click', this.categoryEditListener.bind(this));
        todoAddElem?.addEventListener('click', this.todoAddListener.bind(this));
    }

    #renderCategoryList() {
        let html = this.categoryList
            .map(
                (category) => `
            <button 
                type="button"
                class="${this.settings.categoryItemClassName} ${category.isActive ? 'is-active' : ''}"
                data-category-name="${category.name}"
                data-category-id="${category.id}"
            >
                <span>${category.name}</span>
                <span class="material-symbols-outlined" data-function="category-remove">close</span>
            </button>
        `
            )
            .join('');

        return html;
    }

    #renderTodoList() {
        let todoList = this.categoryActive?.todoList || [];
        let html = ``;

        if (this.categoryList.length) {
            html += `<div class="${this.settings.todoContainerTitleClassName}">
                <strong>${this.categoryActive?.name || ''}</strong>
                <em>${this.todoCompletedCount} / ${this.todoCount}</em>
                <span class="material-symbols-outlined" data-function="category-edit">edit</span>
            </div>`;
        }

        html += todoList
            .map(
                (todo) => `
                <div 
                    class="${this.settings.todoItemClassName} 
                    ${todo.completed ? `${this.settings.todoItemClassName}--completed` : ''}"
                    data-todo-id="${todo.id}"
                    data-todo-name="${todo.name}"
                    draggable="true"
                >
                    <input 
                        type="checkbox" 
                        name="todo-item" 
                        data-function="todo-toggle" 
                        value="${todo.id}"
                        ${todo.completed ? 'checked' : ''}
                    />
                    <strong>${todo.name}</strong>
                    <span class="material-symbols-outlined" data-function="todo-remove">close</span>
                </div>
            `
            )
            .join('');

        if (this.categoryList.length) {
            html += `<div class="${this.settings.todoAddClassName}" data-function="todo-add">
                <span>Добавить задачу</span>
                <span class="material-symbols-outlined">add</span>
            </div>`;
        }

        return html;
    }

    render() {
        this.container.innerHTML = `
            <div class="${this.settings.categoryContainerClassName}">
                ${this.#renderCategoryList()}
                <button type="button" class="${this.settings.categoryItemClassName}" data-function="category-add">
                    <span>Добавить</span>
                    <span class="material-symbols-outlined">add</span>
                </button>
            </div>
            <div class="${this.settings.todoContainerClassName}">
                ${this.#renderTodoList()}
            </div>
        `;
    }

    init() {
        this.categoryList = StorageService.get('categoryList') || [];
        this.render();
        this.setListeners();
    }
}

const todolistApp = new TodoList('#app');
