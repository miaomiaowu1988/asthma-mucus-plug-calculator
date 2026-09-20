import unittest
from reference_model import predict, PARAMETERS, ROOT
class ReferenceTests(unittest.TestCase):
    def setUp(self):
        self.x=dict(ed_patient_days=0,nasal_polyps=0,gina_step=0,female=0,heart_rate_bpm=70,current_smoking=0,mmef_percent_predicted=0)
    def test_parameter_counts(self):
        self.assertEqual([len(m['coefficients']) for m in PARAMETERS['models'].values()],[6,7])
    def test_build_copies_equal(self):
        self.assertEqual((ROOT/'index.html').read_bytes(),(ROOT/'docs/index.html').read_bytes())
    def test_zero_and_missing(self):
        self.assertTrue(0<predict(self.x,True)<1)
        with self.assertRaises(ValueError):predict(dict(self.x,mmef_percent_predicted=None),True)
    def test_no_numeric_coercion(self):
        for value in [None,'',0,-1,float('inf'),float('nan')]:
            with self.subTest(value=value):
                with self.assertRaises(ValueError):predict(dict(self.x,heart_rate_bpm=value))
    def test_monotonicity(self):
        self.assertGreater(predict(dict(self.x,heart_rate_bpm=100)),predict(self.x))
        self.assertLess(predict(dict(self.x,mmef_percent_predicted=100),True),predict(self.x,True))
if __name__=='__main__':unittest.main()
