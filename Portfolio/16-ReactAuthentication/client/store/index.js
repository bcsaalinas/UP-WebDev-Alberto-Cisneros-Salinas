import { applyMiddleware, combineReducers, createStore } from "redux";
import thunk from "redux-thunk";
import authReducer from "./auth";
import moviesReducer from "./movies";

const rootReducer = combineReducers({
  auth: authReducer,
  movies: moviesReducer,
});

const store = createStore(rootReducer, applyMiddleware(thunk));

export default store;
