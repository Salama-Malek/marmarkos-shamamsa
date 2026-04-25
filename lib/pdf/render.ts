import * as Print from 'expo-print';

/** Render an HTML string to a PDF file via expo-print. Returns the temp uri. */
export async function htmlToPdf(html: string): Promise<string> {
  const { uri } = await Print.printToFileAsync({
    html,
    width: 612, // US Letter / approx A4 portrait at 72dpi — print engine scales
    height: 792,
    base64: false,
  });
  return uri;
}
