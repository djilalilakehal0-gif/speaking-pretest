// Generic get/set of an Answers field by questionnaire code (the web uses `answers[q.code]`).
import 'eligibility.dart';

const asylumOptions = [asylumNone, asylumPending, asylumGranted, asylumRefused];
const permitOptions = [permitNone, permitExpiredLt2y, permitExpiredGt2y, permitCurrent];

String? getAnswer(Answers a, String code) {
  switch (code) {
    case 'nationality': return a.nationality;
    case 'arrivalDate': return a.arrivalDate;
    case 'hasEmpadronamiento': return a.hasEmpadronamiento;
    case 'hasHistoricalRegistration': return a.hasHistoricalRegistration;
    case 'hasEmploymentExperience': return a.hasEmploymentExperience;
    case 'hasJobOffer': return a.hasJobOffer;
    case 'hasFamilyInSpain': return a.hasFamilyInSpain;
    case 'hasChildrenInSpain': return a.hasChildrenInSpain;
    case 'hasSpanishCitizenFamily': return a.hasSpanishCitizenFamily;
    case 'appliedAsylum': return a.appliedAsylum;
    case 'asylumDecision': return a.asylumDecision;
    case 'criminalRecord': return a.criminalRecord;
    case 'hasContinuousResidenceProof': return a.hasContinuousResidenceProof;
    case 'previousApplication': return a.previousApplication;
    case 'receivedRefusal': return a.receivedRefusal;
    case 'hasLawyer': return a.hasLawyer;
    case 'plansQualifyingTraining': return a.plansQualifyingTraining;
    case 'permitHistory': return a.permitHistory;
  }
  throw ArgumentError('Unknown answer code: $code');
}

Answers setAnswer(Answers a, String code, String value) {
  switch (code) {
    case 'nationality': return a.copyWith(nationality: value);
    case 'arrivalDate': return a.copyWith(arrivalDate: value);
    case 'hasEmpadronamiento': return a.copyWith(hasEmpadronamiento: value);
    case 'hasHistoricalRegistration': return a.copyWith(hasHistoricalRegistration: value);
    case 'hasEmploymentExperience': return a.copyWith(hasEmploymentExperience: value);
    case 'hasJobOffer': return a.copyWith(hasJobOffer: value);
    case 'hasFamilyInSpain': return a.copyWith(hasFamilyInSpain: value);
    case 'hasChildrenInSpain': return a.copyWith(hasChildrenInSpain: value);
    case 'hasSpanishCitizenFamily': return a.copyWith(hasSpanishCitizenFamily: value);
    case 'appliedAsylum': return a.copyWith(appliedAsylum: value);
    case 'asylumDecision': return a.copyWith(asylumDecision: value);
    case 'criminalRecord': return a.copyWith(criminalRecord: value);
    case 'hasContinuousResidenceProof': return a.copyWith(hasContinuousResidenceProof: value);
    case 'previousApplication': return a.copyWith(previousApplication: value);
    case 'receivedRefusal': return a.copyWith(receivedRefusal: value);
    case 'hasLawyer': return a.copyWith(hasLawyer: value);
    case 'plansQualifyingTraining': return a.copyWith(plansQualifyingTraining: value);
    case 'permitHistory': return a.copyWith(permitHistory: value);
  }
  throw ArgumentError('Unknown answer code: $code');
}
