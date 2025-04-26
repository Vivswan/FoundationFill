// Set the current year in the copyright notice
document.addEventListener('DOMContentLoaded', function () {
  const currentYearElement = document.getElementById('current-year');
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }
});