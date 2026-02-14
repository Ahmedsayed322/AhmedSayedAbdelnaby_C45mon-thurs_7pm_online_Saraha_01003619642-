export const createDoc = async (model, { data = {}, options }) => {
  return await model.create(data, options);
};
export const findOneDoc = async (model, { filter = {}, options }) => {
  return await model.findOne(filter, options);
};
export const deleteOneDoc = async (model, { filter = {}, options }) => {
  return await model.deleteOne(filter, options);
};
export const findDocById = async (model, { id, select = {} }) => {
  return await model.findById(id).select(select);
};
export const updateOneDoc = async (model, { filter = {}, options, update={} }) => {
  return await model.updateOne(filter, update, options);
};
