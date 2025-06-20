import React from react;
import { render, screen } from @testing-library/react;
import { ProductStepCrosstab } from @/features/product-step-crosstab/ProductStepCrosstab;
import React from react;
import { render, screen } from @testing-library/react;
import { ProductStepCrosstab } from @/features/product-step-crosstab/ProductStepCrosstab;

describe(ProductStepCrosstab, () => {
  it(renders correctly, () => {
    render(<ProductStepCrosstab />);
    expect(screen.getByText(Product Step Crosstab)).toBeInTheDocument();
  });
});
