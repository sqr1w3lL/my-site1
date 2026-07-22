// Тесты для приложения — использует React Testing Library
// Этот файл проверяет, что компонент App рендерится и содержит ожидаемый текст.
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  // рендерим корневой компонент
  render(<App />);
  // ищем элемент со строкой "learn react" (регистронезависимо)
  const linkElement = screen.getByText(/learn react/i);
  // проверяем, что элемент присутствует в DOM
  expect(linkElement).toBeInTheDocument();
});
