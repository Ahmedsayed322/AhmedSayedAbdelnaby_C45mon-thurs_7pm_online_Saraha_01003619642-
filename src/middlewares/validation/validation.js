import { failResponse } from "../../utils/index.js";




//strategy pattern design
export const Validation = (val) => {
  return (req, res, next) => {
    const keys = Object.keys(val.describe().keys);
    const errors = [];
    for (let key of keys) {
      const subSchema = val.extract(key);
      const { error, value } = subSchema.validate(req[key], {
        abortEarly: false,
      });
      if (error) {
      
        
        error.details.forEach((e) =>
          errors.push({
            field: e.path[0],
            message: e.message,
          }),
        );
      }
    }
    if (errors.length) {
      return failResponse(res, { message: "Validation Error", errors });
    }
    next();
  };
};
