export const grey = {
  25: '#F9FAFB',
  50: '#F6F7F8',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
}

export const primary = {
  25: '#F5EAFD',
  50: '#EDD6FB',
  100: '#DAB1F8',
  200: '#C488F3',
  300: '#B060EE',
  400: '#9C37EA',
  500: '#8529cd', // Main color updated
  600: '#731DB6',
  700: '#5D1995',
  800: '#471474',
  900: '#310F53',
  main: '#8529cd',
}

export const success = {
  25: '#F1FEF5',
  50: '#E3FDEB',
  100: '#CDFBDB',
  200: '#9DF7C2',
  300: '#6AE9AA',
  400: '#43D49A',
  500: '#11b886',
  600: '#0C9E80',
  700: '#088477',
  800: '#056A6A',
  900: '#035058',
  main: '#11b886',
}

export const warning = {
  25: '#FFFCF5',
  50: '#FFF8E6',
  100: '#FFF8E6',
  200: '#FFEBB3',
  300: '#FEDE80',
  400: '#FED14D',
  500: '#FEBF06',
  600: '#DB7E24',
  700: '#B75F19',
  800: '#93440F',
  900: '#7A3109',
  main: '#FEBF06',
}

export const error = {
  25: '#FEF6F8',
  50: '#FEF1F4',
  100: '#FDE8ED',
  200: '#FBD5DE',
  300: '#F7A6BA',
  400: '#F37795',
  500: '#EF4770',
  600: '#EB194C',
  700: '#C0113C',
  800: '#910D2D',
  900: '#63091F',
  main: '#EF4770',
}

export const secondary = {
  ...grey,
  main: '#8529cd', // Secondary main color updated
}

export const info = {
  light: '#F5EAFD', // Adjusted to be consistent with primary
  main: '#8529cd', // Updated to your preferred main color
  dark: '#5D1995', // A darker shade for info
}

// FOR LIGHT THEME ACTION COLORS
export const textLight = {
  primary: grey[900],
  disabled: grey[200],
  secondary: grey[500],
}

// FOR DARK THEME TEXT COLORS
export const textDark = {
  primary: '#ffffff',
  disabled: grey[200],
  secondary: grey[400],
}
