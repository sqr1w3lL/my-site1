// Тесты для приложения — использует React Testing Library
// Этот файл проверяет, что компонент App рендерится и содержит ожидаемый текст.
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app correctly', () => {
  // рендерим корневой компонент
  render(<App />);
  // ищем элемент со строкой "МурМир" - название приложения
  const appElement = screen.getByText(/МурМир/i);
  // проверяем, что элемент присутствует в DOM
  expect(appElement).toBeInTheDocument();
});
