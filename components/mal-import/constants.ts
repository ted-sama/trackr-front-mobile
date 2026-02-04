import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const GRID_COLUMNS = 3;
export const GRID_GAP = 10;
export const GRID_PADDING = 16;
export const GRID_BORDER_RADIUS = 6;
export const GRID_BORDER_WIDTH = 2;
export const CARD_WIDTH = (width - GRID_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
export const CARD_HEIGHT = CARD_WIDTH * 1.5;
