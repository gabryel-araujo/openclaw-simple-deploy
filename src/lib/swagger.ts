import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "app",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "SimpleClaw BR API Documentation",
        version: "1.0",
      },
      security: [],
    },
  });
  return spec;
};
