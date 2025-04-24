import {ThemeMode} from '../types';
import {applyTheme, listenForThemeChanges} from './theme';

export class ThemeService {
    private currentTheme: ThemeMode = 'system';
    private listeners: ((theme: ThemeMode) => void)[] = [];

    constructor(initialTheme: ThemeMode = 'system') {
        this.currentTheme = initialTheme;
        this.applyTheme();
        this.setupSystemThemeListener();
    }

    setTheme(theme: ThemeMode): void {
        this.currentTheme = theme;
        this.applyTheme();
        this.notifyListeners();
    }

    getTheme(): ThemeMode {
        return this.currentTheme;
    }

    addListener(listener: (theme: ThemeMode) => void): void {
        this.listeners.push(listener);
    }

    private applyTheme(): void {
        applyTheme(this.currentTheme);
    }

    private setupSystemThemeListener(): void {
        listenForThemeChanges(this.currentTheme, () => {
            this.applyTheme();
        });
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.currentTheme));
    }
}