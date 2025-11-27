' Script name: AutoGain
' It monitors the input which has AutoGain in the name
' and automatically adjusts the gain to prevent clipping or low volume.
' You can configure the clip and peak treshhold values bellow.

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " AutoGain 0.0.1")

' Configuration
Dim loopTime = 50
Dim clipThreshold As Double = 0.9  ' 0.9 ~ -1dB | Decibels = 20 * Math.Log10(Amplitude)
Dim peakThreshold As Double = 0.4  ' 0.4 ~ -8dB
Dim voiceThreshold As Double = 0.1  ' 0.1 ~ -20dB
Dim peakWaitLimit As Integer = 5000
Dim gainUpTime As Integer = 3000
Dim gainDownTime As Integer = 2000

Dim voicePeakTimestamp As DateTime = DateTime.Now  ' When translator last reached peakThreshold
Dim voiceTimestamp As DateTime = DateTime.Now  ' When translator last spoke above voiceThreshold

Dim xml = New System.Xml.XmlDocument()

Do While True
    Sleep(loopTime)

    Try
        ' Load vMix XML
        xml.LoadXml(API.XML())

        ' Get Translator mic input node
        Dim micNode = xml.SelectSingleNode("//input[contains(@title, 'AutoGain')]")
        If micNode Is Nothing Then
            Console.WriteLine(timestamp & " AutoGain | No inputs have 'AutoGain' in the name.")
            Sleep(5000)
            Continue Do
        End If

        Dim meterF1 As Double = CDbl(micNode.Attributes("meterF1").Value)
        Dim inputNumber As String = micNode.Attributes("number").Value
        Dim gainDb As Integer = CInt(micNode.Attributes("gainDb").Value)

        If meterF1 > clipThreshold Then
            ' Decrease gain to prevent clipping
            API.Function("SetGain", Input:=inputNumber, Value:=CStr(Math.Max(gainDb - 1, 0)))
            Sleep(gainDownTime)
        End If

        If meterF1 > peakThreshold Then
            voicePeakTimestamp = DateTime.Now
        End If

        If meterF1 > voiceThreshold Then
            voiceTimestamp = DateTime.Now
        End If

        Dim peakDuration As Double = (DateTime.Now - voicePeakTimestamp).TotalMilliseconds
        Dim voiceDuration As Double = (DateTime.Now - voiceTimestamp).TotalMilliseconds
        If peakDuration > peakWaitLimit And voiceDuration < peakWaitLimit Then
            ' Increase gain if no peaks detected for gainUpTime
            API.Function("SetGain", Input:=inputNumber, Value:=CStr(Math.Min(gainDb + 1, 24)))
            Sleep(gainUpTime)
        End If

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " AutoGain | Unexpected error: " & ex.Message)
    End Try
Loop
