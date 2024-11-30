
export const commonFunctionsInclude = `


    #ifndef COMMON_FUNCTION
    #define COMMON_FUNCTION
    float calculateLogDepth(float depth){
    
        return log(depth-1.0)/log(1e25-1.0);
    
    }
    #endif
`