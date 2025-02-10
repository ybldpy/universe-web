export const NEAR_PLANE = 1.0
export const FAT_PLANE = 1e20
export const commonFunctionsInclude = `


    #ifndef COMMON_FUNCTION
    #define COMMON_FUNCTION
    float calculateLogDepth(float depth){
    
        return log2(depth-1.0)/log2(${FAT_PLANE}.0-1.0);
        //return depth / 1e20;
    }
    #endif
`