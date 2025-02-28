import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProjectInfo, ProjectData, getCurrentProjectId, getProjectById } from '@utils/projectStorage';

// 应用状态接口
export interface AppState {
  darkMode: boolean;
  loading: boolean;
  currentProject: ProjectData | null;
  currentProjectId: string | null;
  version: string;
}

// 从localStorage获取当前项目ID
const savedProjectId = getCurrentProjectId();
// 加载当前项目数据
const savedProject = savedProjectId ? getProjectById(savedProjectId) : null;

// 初始状态
const initialState: AppState = {
  darkMode: localStorage.getItem('pdmaner_dark_mode') === 'true',
  loading: false,
  currentProject: savedProject,
  currentProjectId: savedProjectId,
  version: '5.0.0',
};

// 创建应用切片
const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // 切换深色模式
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('pdmaner_dark_mode', state.darkMode.toString());
    },
    
    // 设置加载状态
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // 设置当前项目
    setCurrentProject: (state, action: PayloadAction<ProjectData | null>) => {
      // 使用深拷贝确保不会修改原始对象，也不会共享引用
      state.currentProject = action.payload ? JSON.parse(JSON.stringify(action.payload)) : null;
      state.currentProjectId = action.payload ? action.payload.info.id : null;
    },
    
    // 更新当前项目
    updateCurrentProject: (state, action: PayloadAction<ProjectData>) => {
      // 使用深拷贝确保不会修改原始对象，也不会共享引用
      state.currentProject = JSON.parse(JSON.stringify(action.payload));
    }
  }
});

// 导出动作创建器
export const { toggleDarkMode, setLoading, setCurrentProject, updateCurrentProject } = appSlice.actions;

// 导出切片 reducer
export default appSlice.reducer; 