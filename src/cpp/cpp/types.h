#include "optional.hpp"
#include "any.hpp"

using namespace std;
using namespace std::experimental;

bool getBooleanConst();
    
double getNumberConst();
    
wstring getStringConst();
    
vector<optional<double>> getNumberOrNullArrayConst();
    
vector<double> getNumberArrayConst();
    
vector<vector<wstring>> getStringArrayArrayConst();
    
any getAnyConst();
    
optional<bool> getOptionalBooleanConst();
    
optional<double> getOptionalNumberConst();
    
optional<wstring> getOptionalStringConst();
    
optional<vector<double>> getOptionalNumberArrayConst();
    
optional<any> getOptionalNullAnyConst();
    
optional<any> getOptionalNonNullAnyConst();
    
bool getBooleanVar();
    
void setBooleanVar(bool booleanVar);
    
double getNumberVar();
    
void setNumberVar(double numberVar);
    
wstring getStringVar();
    
void setStringVar(wstring stringVar);
    
vector<double> getNumberArrayVar();
    
void setNumberArrayVar(vector<double> numberArrayVar);
    
any getAnyVar();
    
void setAnyVar(any anyVar);
    
vector<vector<wstring>> getStringArrayArrayVar();
    
void setStringArrayArrayVar(vector<vector<wstring>> stringArrayArrayVar);
    
optional<bool> getOptionalBooleanVar();
    
void setOptionalBooleanVar(bool optionalBooleanVar);
    
optional<double> getOptionalNumberVar();
    
void setOptionalNumberVar(double optionalNumberVar);
    
optional<wstring> getOptionalStringVar();
    
void setOptionalStringVar(wstring optionalStringVar);
    
optional<vector<double>> getOptionalNumberArrayVar();
    
void setOptionalNumberArrayVar(vector<double> optionalNumberArrayVar);
    
optional<any> getOptionalAnyVar();
    
void setOptionalAnyVar(any optionalAnyVar);