/**
 * Zod schema validation middleware
 * Usage: validate(yourZodSchema)
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = (result.error?.issues || []).map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        console.error("[Zod Error Full]", result.error); return res.status(400).json({
          success: false,
          message: errors.length > 0 ? errors[0].message : 'Validation failed',
          errors,
        });
      }
      req.body = result.data;  // Use parsed + coerced data
      next();
    } catch (err) {
      // Validation itself threw — skip validation and continue
      next();
    }
  };
}

module.exports = validate;
