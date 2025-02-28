import { combineReducers } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';

const rootReducer = combineReducers({
  app: appReducer,
  // 后续会添加更多reducer
});

export default rootReducer; 