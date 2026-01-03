import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Project {
    id: string;
    name: string;
    description?: string;
    status: string;
    health: string;
    lastAccessedAt: string;
    currentVersion: string;
    githubRepo?: string;
    githubConnected?: boolean;
    updatedAt: string;
}

interface ProjectState {
    activeProject: Project | null;
    version: string;
}

const initialState: ProjectState = {
    activeProject: null,
    version: 'v1',
};

export const projectSlice = createSlice({
    name: 'project',
    initialState,
    reducers: {
        setActiveProject: (state, action: PayloadAction<Project>) => {
            state.activeProject = action.payload;
        },
        setVersion: (state, action: PayloadAction<string>) => {
            state.version = action.payload;
        },
        clearActiveProject: (state) => {
            state.activeProject = null;
            state.version = 'v1';
        },
    },
});

export const { setActiveProject, setVersion, clearActiveProject } = projectSlice.actions;

export default projectSlice.reducer;
