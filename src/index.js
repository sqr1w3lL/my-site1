// Подключаем библиотеки: 1.Библиотека реакт для создания компонентов. 2. DOM для вставки компонентов в HTML. 3. CSS для стилизации. 4. Главный компонент приложения.
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Ищем корневой элемент в HTML и создаём корень React
const root = ReactDOM.createRoot(document.getElementById('root'));

// Рендерим главный компонент приложения в корень
root.render(
   <App />
);
