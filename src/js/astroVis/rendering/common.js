export const NEAR_PLANE = 1.0
export const FAT_PLANE = 1e25
export const commonFunctionsInclude = `


    #ifndef COMMON_FUNCTION
    #define COMMON_FUNCTION
    float calculateLogDepth(float depth){
    
        return log(depth-1.0)/log(${FAT_PLANE}-1.0);
    
    }
    #endif
`