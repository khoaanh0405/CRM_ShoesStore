import { validateBody, validateParams } from './common.validator.js';

/** maxLength khớp đúng VARCHAR đã khai trong schema.prisma/migration. */
const PRODUCT_FIELDS = {
  productName: { type: 'string', maxLength: 150 },
  category: { type: 'string', maxLength: 50 },
  brand: { type: 'string', maxLength: 50 },
  size: { type: 'string', maxLength: 10 },
  color: { type: 'string', maxLength: 30 },
  material: { type: 'string', maxLength: 50 },
  price: { type: 'number', min: 0 },
  stockQuantity: { type: 'int', min: 0 },
  isActive: { type: 'boolean' },
  imageUrl: { type: 'string', maxLength: 500 },
};

export const productValidator = {
  idParam: validateParams('id'),
  supplierIdParam: validateParams('supplierId'),

  create: validateBody({
    ...PRODUCT_FIELDS,
    supplierId: { required: true, type: 'int', min: 1 },
    productName: { required: true, type: 'string', maxLength: 150 },
    price: { required: true, type: 'number', min: 0 },
  }),

  update: validateBody({
    ...PRODUCT_FIELDS,
    supplierId: { type: 'int', min: 1 },
  }),

  setActive: validateBody({
    isActive: { required: true, type: 'boolean' },
  }),
};

export default productValidator;
