export interface LaunchpadColor {
  name: string;
  value: number;
  color: string;
}

export const LAUNCHPAD_COLORS: LaunchpadColor[] = [
  { name: 'off', value: 0x00, color: '#000000' },
  { name: 'darkgray', value: 0x01, color: '#A5A5A5' },
  { name: 'dimgray', value: 0x02, color: '#575757' },
  { name: 'darkgray', value: 0x03, color: '#999999' },
  { name: 'dimgray', value: 0x04, color: '#6E4D4D' },
  { name: 'brown', value: 0x05, color: '#993939' },
  { name: 'saddlebrown', value: 0x06, color: '#672C2C' },
  { name: 'saddlebrown', value: 0x07, color: '#693838' },
  { name: 'dimgray', value: 0x08, color: '#7C7668' },
  { name: 'sienna', value: 0x09, color: '#A5743E' },
  { name: 'saddlebrown', value: 0x0a, color: '#6A432E' },
  { name: 'darkolivegreen', value: 0x0b, color: '#684438' },
  { name: 'gray', value: 0x0c, color: '#90875B' },
  { name: 'yellowgreen', value: 0x0d, color: '#A8A840' },
  { name: 'olivedrab', value: 0x0e, color: '#7C7C36' },
  { name: 'olivedrab', value: 0x0f, color: '#868648' },
  { name: 'dimgray', value: 0x10, color: '#6F8151' },
  { name: 'yellowgreen', value: 0x11, color: '#90BD48' },
  { name: 'darkolivegreen', value: 0x12, color: '#364B20' },
  { name: 'darkolivegreen', value: 0x13, color: '#466235' },
  { name: 'darkolivegreen', value: 0x14, color: '#56714F' },
  { name: 'forestgreen', value: 0x15, color: '#348C34' },
  { name: 'darkgreen', value: 0x16, color: '#2B632B' },
  { name: 'darkolivegreen', value: 0x17, color: '#386938' },
  { name: 'dimgray', value: 0x18, color: '#5B785B' },
  { name: 'seagreen', value: 0x19, color: '#3A9C55' },
  { name: 'seagreen', value: 0x1a, color: '#357A41' },
  { name: 'darkslategreen', value: 0x1b, color: '#305935' },
  { name: 'dimgray', value: 0x1c, color: '#617F66' },
  { name: 'seagreen', value: 0x1d, color: '#368F73' },
  { name: 'darkslategray', value: 0x1e, color: '#2E6A4D' },
  { name: 'seagreen', value: 0x1f, color: '#488660' },
  { name: 'slategray', value: 0x20, color: '#61807A' },
  { name: 'turquoise', value: 0x21, color: '#59ECD7' },
  { name: 'darkslategray', value: 0x22, color: '#1B3F37' },
  { name: 'darkslategray', value: 0x23, color: '#2E5648' },
  { name: 'slategray', value: 0x24, color: '#678187' },
  { name: 'seagreen', value: 0x25, color: '#2C7078' },
  { name: 'darkslategray', value: 0x26, color: '#27525C' },
  { name: 'darkslategray', value: 0x27, color: '#385E69' },
  { name: 'dimgray', value: 0x28, color: '#5D6A7B' },
  { name: 'steelblue', value: 0x29, color: '#367292' },
  { name: 'darkslateblue', value: 0x2a, color: '#3D668D' },
  { name: 'darkslategray', value: 0x2b, color: '#2B3A50' },
  { name: 'darkslateblue', value: 0x2c, color: '#4C4279' },
  { name: 'darkslateblue', value: 0x2d, color: '#313183' },
  { name: 'midnightblue', value: 0x2e, color: '#2A2A60' },
  { name: 'darkslateblue', value: 0x2f, color: '#484886' },
  { name: 'dimgray', value: 0x30, color: '#6C5E87' },
  { name: 'mediumpurple', value: 0x31, color: '#9459EC' },
  { name: 'midnightblue', value: 0x32, color: '#1F1737' },
  { name: 'darkslategray', value: 0x33, color: '#352B52' },
  { name: 'gray', value: 0x34, color: '#9A6C9A' },
  { name: 'rebeccapurple', value: 0x35, color: '#722A72' },
  { name: 'darkslateblue', value: 0x36, color: '#602960' },
  { name: 'darkslateblue', value: 0x37, color: '#693869' },
  { name: 'dimgray', value: 0x38, color: '#7F596A' },
  { name: 'purple', value: 0x39, color: '#8B3369' },
  { name: 'indianred', value: 0x3a, color: '#9D4472' },
  { name: 'darkslategray', value: 0x3b, color: '#422333' },
  { name: 'saddlebrown', value: 0x3c, color: '#74342B' },
  { name: 'darkolivegreen', value: 0x3d, color: '#644C29' },
  { name: 'darkolivegreen', value: 0x3e, color: '#4E4422' },
  { name: 'dimgray', value: 0x3f, color: '#797948' },
  { name: 'darkslategray', value: 0x40, color: '#305930' },
  { name: 'cadetblue', value: 0x41, color: '#59A581' },
  { name: 'darkslategray', value: 0x42, color: '#253653' },
  { name: 'darkslateblue', value: 0x43, color: '#393999' },
  { name: 'darkslategray', value: 0x44, color: '#294D4D' },
  { name: 'darkslateblue', value: 0x45, color: '#533992' },
  { name: 'dimgray', value: 0x46, color: '#5F535A' },
  { name: 'darkslategray', value: 0x47, color: '#52454B' },
  { name: 'saddlebrown', value: 0x48, color: '#7C2E2E' },
  { name: 'darkkhaki', value: 0x49, color: '#9DA568' },
  { name: 'olivedrab', value: 0x4a, color: '#73792E' },
  { name: 'olivedrab', value: 0x4b, color: '#769438' },
  { name: 'darkolivegreen', value: 0x4c, color: '#427D36' },
  { name: 'mediumseagreen', value: 0x4d, color: '#40A886' },
  { name: 'steelblue', value: 0x4e, color: '#36838F' },
  { name: 'steelblue', value: 0x4f, color: '#4879C0' },
  { name: 'darkslateblue', value: 0x50, color: '#463081' },
  { name: 'mediumorchid', value: 0x51, color: '#BC59E9' },
  { name: 'darkslategray', value: 0x52, color: '#512F4B' },
  { name: 'darkolivegreen', value: 0x53, color: '#584035' },
  { name: 'saddlebrown', value: 0x54, color: '#71472B' },
  { name: 'olivedrab', value: 0x55, color: '#798834' },
  { name: 'darkolivegreen', value: 0x56, color: '#5F733E' },
  { name: 'forestgreen', value: 0x57, color: '#389738' },
  { name: 'darkolivegreen', value: 0x58, color: '#54784B' },
  { name: 'gray', value: 0x59, color: '#7C9A82' },
  { name: 'slategray', value: 0x5a, color: '#628D88' },
  { name: 'dimgray', value: 0x5b, color: '#65717F' },
  { name: 'dimgray', value: 0x5c, color: '#50617B' },
  { name: 'slategray', value: 0x5d, color: '#786D8C' },
  { name: 'rebeccapurple', value: 0x5e, color: '#78437B' },
  { name: 'palevioletred', value: 0x5f, color: '#C04899' },
  { name: 'sienna', value: 0x60, color: '#80612F' },
  { name: 'khaki', value: 0x61, color: '#E1DC59' },
  { name: 'darkolivegreen', value: 0x62, color: '#41491B' },
  { name: 'darkolivegreen', value: 0x63, color: '#6B622E' },
  { name: 'darkolivegreen', value: 0x64, color: '#5F5533' },
  { name: 'darkslategray', value: 0x65, color: '#2C5736' },
  { name: 'darkslategray', value: 0x66, color: '#305039' },
  { name: 'darkslategray', value: 0x67, color: '#4B4B5E' },
  { name: 'darkslategray', value: 0x68, color: '#3D4262' },
  { name: 'dimgray', value: 0x69, color: '#756149' },
  { name: 'sienna', value: 0x6a, color: '#8D3D3D' },
  { name: 'dimgray', value: 0x6b, color: '#705048' },
  { name: 'darkolivegreen', value: 0x6c, color: '#765837' },
  { name: 'dimgray', value: 0x6d, color: '#837D48' },
  { name: 'darkolivegreen', value: 0x6e, color: '#666C46' },
  { name: 'darkkhaki', value: 0x6f, color: '#A0B358' },
  { name: 'darkslategray', value: 0x70, color: '#434355' },
  { name: 'wheat', value: 0x71, color: '#E6E6C5' },
  { name: 'darkslategray', value: 0x72, color: '#373F39' },
  { name: 'dimgray', value: 0x73, color: '#6B6B76' },
  { name: 'lightslategray', value: 0x74, color: '#8A809A' },
  { name: 'darkslategray', value: 0x75, color: '#4F4F4F' },
  { name: 'dimgray', value: 0x76, color: '#5C5C5C' },
  { name: 'lightslategray', value: 0x77, color: '#939797' },
  { name: 'saddlebrown', value: 0x78, color: '#742F2F' },
  { name: 'darkolivegreen', value: 0x79, color: '#5C3333' },
  { name: 'olivedrab', value: 0x7a, color: '#5BAF44' },
  { name: 'darkslategray', value: 0x7b, color: '#234223' },
  { name: 'darkolivegreen', value: 0x7c, color: '#6E6C2B' },
  { name: 'darkolivegreen', value: 0x7d, color: '#4C4429' },
  { name: 'darkolivegreen', value: 0x7e, color: '#544422' },
  { name: 'sienna', value: 0x7f, color: '#925848' },
];

export function getLaunchpadColorValue(hex: string): number | undefined {
  const color = LAUNCHPAD_COLORS.find(
    (c) => c.color.toLowerCase() === hex.toLowerCase(),
  );
  return color?.value;
}

export default LAUNCHPAD_COLORS;
