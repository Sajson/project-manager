enum ProjectStatus {
  Active,
  Finished,
}

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {}
}

type Listener = (items: Project[]) => void;

// State manager
class State {
  private listeners: Listener[] = [];
  private projects: Project[] = [];
  private static instance: State;
  private constructor() {}

  static createInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new State();
    return this.instance;
  }

  addListener(listenerFn: Listener) {
    this.listeners.push(listenerFn);
  }

  addProject(title: string, desc: string, numOfPeople: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      desc,
      numOfPeople,
      ProjectStatus.Active
    );
    this.projects.push(newProject);
    for (const listenerFn of this.listeners) {
      listenerFn(this.projects.slice());
    }
  }
}

// create class instace of application state
const appState = State.createInstance();

// Validator
interface Validatable {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}

function validate(validatableInput: Validatable): boolean {
  let isValid = true;
  // check is this field required
  if (validatableInput.required) {
    isValid =
      validatableInput.value.toString().trim().length !== 0 ? true : false;
  }
  // check is this pass minimal length
  if (
    validatableInput.minLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length >= validatableInput.minLength;
  }
  // check is this pass maximum length
  if (
    validatableInput.maxLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length < validatableInput.maxLength;
  }
  return isValid;
}

// autobind decorator
function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const adjustedDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    },
  };
  return adjustedDescriptor;
}

class ProjectList {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  sectionElement: HTMLElement;
  assignedProjects: Project[] = [];

  constructor(private type: "active" | "finished") {
    this.templateElement = document.getElementById(
      "project-list"
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById("app")! as HTMLDivElement;

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );

    this.sectionElement = importedNode.firstElementChild as HTMLElement;
    this.sectionElement.id = `${this.type}-projects`;

    appState.addListener((projects: Project[]) => {
      const filteredProjects = projects.filter((project) => {
        if (this.type === "active") {
          return project.status === ProjectStatus.Active;
        }
        return project.status === ProjectStatus.Finished;
      });
      this.assignedProjects = filteredProjects;
      this.renderProjects();
    });
    this.attach();
    this.renderContent();
  }

  private renderProjects() {
    const listElement = document.getElementById(`${this.type}-project-list`)!;
    listElement.innerHTML = "";
    for (const item of this.assignedProjects) {
      const listItem = document.createElement("li");
      listItem.textContent = item.title;
      listElement.appendChild(listItem);
    }
  }

  private renderContent() {
    const listId = `${this.type}-project-list`;
    this.sectionElement.querySelector("ul")!.id = listId;
    this.sectionElement.querySelector(
      "h2"
    )!.textContent = `${this.type.toLocaleUpperCase()} PROJECTS`;
  }

  private attach() {
    this.hostElement.insertAdjacentElement("beforeend", this.sectionElement);
  }
}

class ProjectInput {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  formElement: HTMLFormElement;
  titleInputElement: HTMLInputElement;
  descInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    this.templateElement = document.getElementById(
      "project-input"
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById("app")! as HTMLDivElement;

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );

    this.formElement = importedNode.firstElementChild as HTMLFormElement;
    this.formElement.id = "user-input";

    this.titleInputElement = this.formElement.querySelector("#title")!;
    this.descInputElement = this.formElement.querySelector("#description")!;
    this.peopleInputElement = this.formElement.querySelector("#people")!;
    this.createListener();
    this.attach();
  }

  private fetchUserInput(): [string, string, number] | void {
    const title = this.titleInputElement.value;
    const desc = this.descInputElement.value;
    const people = this.peopleInputElement.value;

    const titleValidatable: Validatable = {
      value: title,
      required: true,
      minLength: 5,
    };
    const descValidatable: Validatable = {
      value: desc,
      required: true,
      minLength: 5,
    };
    // people is validated by input min and max attributes

    if (validate(titleValidatable) && validate(descValidatable)) {
      return [title, desc, +people];
    } else {
      console.error(`Invalid input!`);
      return;
    }
  }

  private clearInputs() {
    this.titleInputElement.value = "";
    this.descInputElement.value = "";
    this.peopleInputElement.value = "";
  }

  @autobind
  private handleSubmit(event: Event) {
    event.preventDefault();
    const userInput = this.fetchUserInput();
    if (Array.isArray(userInput)) {
      const [title, desc, people] = userInput;
      appState.addProject(title, desc, people);
      this.clearInputs();
    }
  }

  private createListener() {
    this.formElement.addEventListener("submit", this.handleSubmit);
  }

  private attach() {
    this.hostElement.insertAdjacentElement("afterbegin", this.formElement);
  }
}

// Create instance of ProjectInput field
const projectInput = new ProjectInput();
const activeProjectList = new ProjectList("active");
const finishedProjectList = new ProjectList("finished");
