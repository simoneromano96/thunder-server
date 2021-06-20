import svgo from "svgo"

export const optimizeSvg = async (svgString: string): Promise<string> => (await svgo.optimize(svgString)).data
