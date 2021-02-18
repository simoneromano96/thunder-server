// @ts-ignore: @types/svgo is not yet updated to svgo 2.x.x
import svgo from "svgo"

export const optimizeSvg = async (svgString: string): Promise<string> => (await svgo.optimize(svgString)).data
