import { getTranslations } from 'next-intl/server';

import { TitleBar } from '@/features/dashboard/TitleBar';
import { ProductStepCrosstabContainer } from '@/features/product-step-crosstab/ProductStepCrosstabContainer';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'ProductStepCrosstab',
  });

  return {
    title: t('title'),
  };
}

const ProductStepCrosstabPage = async (props: { params: { locale: string } }) => {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'ProductStepCrosstab',
  });

  return (
    <>
      <TitleBar title={t('title')} description={t('description')} />
      <ProductStepCrosstabContainer />
    </>
  );
};

export default ProductStepCrosstabPage;
